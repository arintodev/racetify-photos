<template>
  <USlideover title="Photo Details" v-model:open="isOpen" :ui="{
    overlay: 'z-[110]',
    content: 'z-[120]'
  }">
    <template #body>
      <div v-if="loading" class="flex flex-col items-center justify-center py-8 space-y-3">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
        <p class="text-sm text-gray-600 dark:text-gray-400">Loading photo details...</p>
      </div>

      <div v-else-if="error" class="text-center py-8 text-red-600 dark:text-red-400">
        <p class="text-sm">{{ error }}</p>
      </div>
      
      <div v-else-if="photoDetail" class="space-y-4">
        <!-- Name -->
        <div v-if="photoDetail.name" class="space-y-1">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</span>
          <p class="text-sm text-gray-900 dark:text-white">{{ photoDetail.name }}</p>
        </div>

        <div v-if="photoDetail.height && photoDetail.width" class="space-y-1">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Dimension</span>
          <p class="text-sm text-gray-900 dark:text-white">{{ photoDetail.width }} x {{ photoDetail.height }}</p>
        </div>

        <!-- Camera Info -->
        <div v-if="photoDetail.camera && (photoDetail.camera.make || photoDetail.camera.model)" class="space-1">
          <div class="space-1">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Camera</span>
            <p class="text-sm text-gray-900 dark:text-white">{{ photoDetail.camera.make }} {{
              photoDetail.camera.model
            }}</p>
          </div>
          <div class="space-y-2">
            <div class="flex gap-4 text-sm font-mono text-gray-900 dark:text-white">
              <div v-if="photoDetail.camera.aperture" class="space-y-1">
                <span>f/{{ photoDetail.camera.aperture }}</span>
              </div>

              <div v-if="photoDetail.camera.exposure_time" class="space-y-1">
                <span>{{ formatExposureTime(photoDetail.camera.exposure_time) }}</span>
              </div>

              <div v-if="photoDetail.camera.focal_length" class="space-y-1">
                <span>{{ photoDetail.camera.focal_length }}mm</span>
              </div>

              <div v-if="photoDetail.camera.iso" class="space-y-1">
                <span>ISO{{ photoDetail.camera.iso }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Location -->
        <div v-if="photoDetail.photo_locations?.name" class="space-y-1">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Location</span>
          <p class="text-sm text-gray-900 dark:text-white">{{ photoDetail.photo_locations.name }}</p>
        </div>

        <!-- Date -->
        <div v-if="photoDetail.date" class="space-y-1">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</span>
          <p class="text-sm text-gray-900 dark:text-white">{{ formatDate(photoDetail.date) }}</p>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { Photo } from '~/types'

interface PhotoDetail extends Photo {
  name?: string
  camera?: {
    make?: string
    model?: string
    aperture?: number
    exposure_time?: number
    focal_length?: number
    iso?: number
  }
  photo_locations?: {
    name: string
  }
  date?: string | Date
}

interface Props {
  visible: boolean
  photoId?: string
}

const { authFetch } = useAuthFetch()

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

// Photo detail state
const photoDetail = ref<PhotoDetail | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Fetch photo detail function
const fetchPhotoDetail = async (photoId: string) => {
  loading.value = true
  error.value = null

  try {
    const { data } = await authFetch(`/api/photo-detail`, {
      query: { photo_id: photoId }
    })

    if (data) {
      photoDetail.value = {
        ...data,
        name: data.original_name,
        camera: {
          make: data.cam_make,
          model: data.cam_model,
          aperture: data.aperture,
          exposure_time: data.exposure_time,
          focal_length: data.focal_length,
          iso: data.iso,
        },
        date: data.original_time || data.created_at
      }
    }
  } catch (err: any) {
    console.error('Error fetching photo detail:', err)
    error.value = err.message || 'Failed to fetch photo detail'
  } finally {
    loading.value = false
  }
}

// Reactive state untuk UModal
const isOpen = computed({
  get: () => props.visible,
  set: (value: boolean) => {
    if (!value) {
      emit('close')
    }
  }
})

// Watch for prop changes and fetch data
watch([() => props.visible, () => props.photoId],
  async ([visible, photoId]) => {
    if (visible && photoId) {
      await fetchPhotoDetail(photoId)
    }
  },
  { immediate: true }
)

// Close modal function
const closeModal = () => {
  emit('close')
}

// Helper functions
const hasCameraSettings = (camera: any): boolean => {
  return !!(camera.aperture || camera.exposure_time || camera.focal_length || camera.iso)
}

const formatExposureTime = (exposureTime: number): string => {
  if (exposureTime >= 1) {
    return `${exposureTime}s`
  } else {
    return `1/${Math.round(1 / exposureTime)}s`
  }
}

const formatDate = (dateValue: string | Date): string => {
  const date = new Date(dateValue)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
