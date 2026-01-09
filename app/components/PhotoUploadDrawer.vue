<template>
  <!-- Floating Upload Button -->
  <div 
    v-if="event" 
    class="fixed right-8 bottom-8 z-50 transition-all duration-300"
  >
    <UButton
      color="primary"
      size="xl"
      class="shadow-lg"
      @click="showUploadDrawer = true"
    >
      <UIcon 
        :name="isUploading ? 'i-lucide-loader-circle' : 'i-lucide-upload'" 
        class="mr-2"
        :class="{ 'animate-spin': isUploading }"
      />
      <span v-if="isUploading">
        Uploading... {{ uploadStats.success }} / {{ uploadStats.total }}
      </span>
      <span v-else>
        Upload Photos
      </span>
    </UButton>
  </div>

  <!-- Upload Drawer -->
  <USlideover 
    v-model:open="showUploadDrawer" 
    title="Upload Photos"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <div class="space-y-6">
        <!-- Selected Event Info -->
        <div v-if="event" class="bg-primary-50 dark:bg-primary-900/10 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <UIcon name="i-lucide-calendar" class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1">
              <div class="text-sm font-medium">Uploading to</div>
              <div class="font-semibold text-highlighted">{{ event.name }}</div>
            </div>
          </div>
        </div>

        <!-- Location Selection -->
        <div v-if="event">
          <label class="text-sm font-medium text-highlighted mb-2 block">Location (Optional)</label>
          <USelectMenu
            v-model="selectedLocation"
            :items="locations"
            label-key="name"
            placeholder="Choose location... (optional)"
            class="w-full"
            :loading="loadingLocations"
          />
        </div>

        <!-- Dropzone -->
        <div>
          <label class="text-sm font-medium text-highlighted mb-2 block">Photos</label>
          <div
            class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
            :class="[
              isDragging
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
            ]"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <p class="text-sm font-medium text-highlighted mb-1">
              Drag & drop photos here
            </p>
            <p class="text-xs text-muted mb-3">or</p>
            <UButton
              color="primary"
              size="sm"
              @click="triggerFileInput"
              :disabled="isUploading"
            >
              <UIcon name="i-lucide-folder-open" class="mr-2" />
              Browse Files
            </UButton>
            <input
              ref="fileInput"
              type="file"
              multiple
              accept="image/*"
              class="hidden"
              @change="handleFileSelect"
            />
            <p class="text-xs text-muted mt-3">
              Photos will be auto-compressed (max 1920px, JPEG)
            </p>
          </div>
        </div>

        <!-- Upload Queue -->
        <div v-if="uploadStats.total > 0" class="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div class="grid grid-cols-4 gap-3 mb-4">
            <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
              <div class="text-lg font-bold text-highlighted">{{ uploadStats.total }}</div>
              <div class="text-xs text-muted">Total</div>
            </div>
            <div class="bg-success/10 rounded-lg p-3 text-center">
              <div class="text-lg font-bold text-success">{{ uploadStats.success }}</div>
              <div class="text-xs text-success">Success</div>
            </div>
            <div class="bg-info/10 rounded-lg p-3 text-center">
              <div class="text-lg font-bold text-info">{{ uploadStats.uploading }}</div>
              <div class="text-xs text-info">Uploading</div>
            </div>
            <div class="bg-error/10 rounded-lg p-3 text-center">
              <div class="text-lg font-bold text-error">{{ uploadStats.error }}</div>
              <div class="text-xs text-error">Failed</div>
            </div>
          </div>

          <div class="flex gap-2 mb-4">
            <UButton
              v-if="uploadStats.error > 0"
              color="warning"
              variant="soft"
              size="sm"
              block
              @click="handleRetryFailed"
              :disabled="isUploading"
            >
              Retry Failed ({{ uploadStats.error }})
            </UButton>
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              block
              @click="clearQueue"
              :disabled="isUploading"
            >
              Clear All
            </UButton>
          </div>

          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="[key, progress] in reversedUploadQueue"
              :key="key"
              class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-center gap-3">
                <UIcon
                  v-if="progress.status === 'success'"
                  name="i-lucide-circle-check"
                  class="w-4 h-4 text-success flex-shrink-0"
                />
                <UIcon
                  v-else-if="progress.status === 'error'"
                  name="i-lucide-circle-x"
                  class="w-4 h-4 text-error flex-shrink-0"
                />
                <UIcon
                  v-else-if="progress.status === 'uploading' || progress.status === 'compressing'"
                  name="i-lucide-loader-circle"
                  class="w-4 h-4 text-info animate-spin flex-shrink-0"
                />
                <UIcon
                  v-else
                  name="i-lucide-clock"
                  class="w-4 h-4 text-dimmed flex-shrink-0"
                />

                <div class="flex-1 min-w-0">
                  <p class="text-sm text-highlighted truncate">
                    {{ progress.file.file.name }}
                  </p>
                  <p v-if="progress.error" class="text-xs text-error mt-1">
                    {{ progress.error }}
                  </p>
                </div>

                <span
                  class="text-xs font-medium"
                  :class="getUploadStatusColor(progress.status)"
                >
                  {{ getUploadStatusText(progress.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { Event, PhotoLocation } from '~/types'
import * as exifr from 'exifr'

interface Props {
  event: Event | null
  locations?: PhotoLocation[]
  loadingLocations?: boolean
  initialLocation?: PhotoLocation | null
}

const props = withDefaults(defineProps<Props>(), {
  locations: () => [],
  loadingLocations: false,
  initialLocation: null
})

function onUploaded(photo: any) {
  emit('uploaded', photo)
}

const emit = defineEmits<{
  'uploaded': [photo: any]
}>()

// Composables
const user = useSupabaseUser()
const { 
  uploadQueue, 
  isUploading, 
  uploadPhotos,
  uploadStats,
  clearQueue,
  retryFailed
} = usePhotoUpload(onUploaded)

// State
const showUploadDrawer = ref(false)
const selectedLocation = ref<PhotoLocation | undefined>(props.initialLocation || undefined)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()

// Computed - reverse upload queue to show newest first
const reversedUploadQueue = computed(() => {
  return Array.from(uploadQueue.value).reverse()
})

// Watch initial location changes
watch(() => props.initialLocation, (newLocation) => {
  selectedLocation.value = newLocation || undefined
})

/**
 * Handle file drop
 */
const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  
  const files = Array.from(event.dataTransfer?.files || [])
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length > 0 && user.value && props.event) {
    startUpload(imageFiles)
  }
}

/**
 * Trigger file input click
 */
const triggerFileInput = () => {
  fileInput.value?.click()
}

/**
 * Handle file select from input
 */
const handleFileSelect = (event: any) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  
  if (files.length > 0 && user.value && props.event) {
    startUpload(files)
  }
  
  if (target) {
    target.value = ''
  }
}

const startUpload = async (files: File[]) => {
  if (!user.value || !props.event) return;

  // Ekstrak metadata (termasuk EXIF) untuk setiap file
  const filesWithMeta = await Promise.all(files.map(async (file) => {
    let exif = null;
    try {
      exif = await exifr.parse(file);
    } catch (e) {
      exif = null;
    }
    return {
      file,
      meta: {
        original_name: file.name,
        original_time: exif?.DateTimeOriginal || null,
        cam_make: exif?.Make || null,
        cam_model: exif?.Model || null,
        lens_model: exif?.LensModel || null,
        iso: exif?.ISO || null,
        aperture: exif?.FNumber || null,
        exposure_time: exif?.ExposureTime || null,
        focal_length: exif?.FocalLength || null,
      }
    };
  }));

  try {
    await uploadPhotos(
      props.event.id,
      selectedLocation.value?.id,
      filesWithMeta,
    );
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

/**
 * Retry failed uploads
 */
const handleRetryFailed = async () => {
  if (!user.value || !props.event) return
  
  await retryFailed(props.event.id, selectedLocation.value?.id)
}

/**
 * Get upload status color
 */
const getUploadStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'text-success'
    case 'error':
      return 'text-error'
    case 'uploading':
    case 'compressing':
      return 'text-info'
    default:
      return 'text-muted'
  }
}

/**
 * Get upload status text
 */
const getUploadStatusText = (status: string) => {
  switch (status) {
    case 'idle':
      return 'Waiting'
    case 'compressing':
      return 'Compressing'
    case 'uploading':
      return 'Uploading'
    case 'success':
      return 'Done'
    case 'error':
      return 'Failed'
    default:
      return status
  }
}
</script>
