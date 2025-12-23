<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-semibold text-highlighted">
            Racetify Photos
          </h1>
          <UButton
            v-if="user"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="handleLogout"
          >
            <UIcon name="i-lucide-log-out" class="mr-2" />
            Logout
          </UButton>
        </div>
      </div>
    </div>

    <!-- Sub Header / Navigation -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex gap-6">
          <UButton
            color="neutral"
            variant="ghost"
            class="rounded-none border-b-2 border-primary-500 py-3"
          >
            <UIcon name="i-lucide-images" class="mr-2" />
            Photos
          </UButton>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumb -->
      <div class="mb-6 flex items-center gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          to="/photographer"
        >
          Albums
        </UButton>
        <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-muted" />
        <span v-if="currentView === 'locations'" class="font-medium text-highlighted">
          {{ event?.name }}
        </span>
        <template v-if="currentView === 'photos'">
          <UButton
            color="neutral"
            variant="ghost"
            @click="goToLocations"
          >
            {{ event?.name }}
          </UButton>
          <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-muted" />
          <span class="font-medium text-highlighted">
            {{ selectedLocation?.name || 'All Photos' }}
          </span>
        </template>
      </div>

      <!-- Loading Event -->
      <div v-if="isLoadingEvent" class="flex justify-center py-20">
        <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary-500" />
      </div>

      <!-- Event Not Found -->
      <div v-else-if="!event" class="text-center py-20">
        <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-lucide-alert-circle" class="w-10 h-10 text-error" />
        </div>
        <h3 class="text-lg font-medium text-highlighted mb-2">Event not found</h3>
        <p class="text-muted mb-4">The event you're looking for doesn't exist or has been removed.</p>
        <UButton to="/photographer" color="primary">
          <UIcon name="i-lucide-arrow-left" class="mr-2" />
          Back to Albums
        </UButton>
      </div>

      <!-- Locations View (Folders in Event) -->
      <div v-else-if="currentView === 'locations' && event">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-highlighted mb-2">{{ event.name }}</h2>
          <p class="text-muted">{{ event.location }}</p>
        </div>

        <!-- All Photos Card -->
        <div
          class="group cursor-pointer mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-all"
          @click="openLocationPhotos(null)"
        >
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
              <UIcon name="i-lucide-images" class="w-7 h-7 text-primary-500" />
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-highlighted group-hover:text-primary-500 transition-colors">
                All Photos
              </h3>
              <p class="text-sm text-muted">
                {{ eventPhotoCount }} {{ eventPhotoCount === 1 ? 'photo' : 'photos' }}
              </p>
            </div>
            <UIcon name="i-lucide-chevron-right" class="w-5 h-5 text-muted" />
          </div>
        </div>

        <!-- Location Folders -->
        <div v-if="loadingLocations" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-circle" class="w-6 h-6 animate-spin text-primary-500" />
        </div>

        <div v-else-if="locationFolders.length > 0" class="space-y-2">
          <div
            v-for="folder in locationFolders"
            :key="folder.id"
            class="group cursor-pointer p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:shadow-sm transition-all"
            @click="openLocationPhotos(folder)"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <UIcon name="i-lucide-folder" class="w-6 h-6 text-amber-500" />
              </div>
              <div class="flex-1">
                <h3 class="font-medium text-highlighted group-hover:text-primary-500 transition-colors">
                  {{ folder.name }}
                </h3>
                <p class="text-sm text-muted">
                  {{ folder.photoCount }} {{ folder.photoCount === 1 ? 'photo' : 'photos' }}
                </p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="w-5 h-5 text-muted" />
            </div>
          </div>
        </div>
      </div>

      <!-- Photos View (Photos in Location/Event) -->
      <div v-else-if="currentView === 'photos' && event">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-highlighted mb-2">
            {{ selectedLocation?.name || 'All Photos' }}
          </h2>
          <p class="text-muted">{{ photos.length }} {{ photos.length === 1 ? 'photo' : 'photos' }}</p>
        </div>

        <div v-if="loadingPhotos" class="flex justify-center py-20">
          <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary-500" />
        </div>

        <div v-else-if="photos.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div
            v-for="photo in photos"
            :key="photo.id"
            class="group relative aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
            @click="openPhotoDetail(photo)"
          >
            <img
              :src="getPhotoUrl(photo.photo_path)"
              :alt="`Photo ${photo.id}`"
              class="w-full h-full object-cover"
              loading="lazy"
              @error="handleImageError"
            />

            <!-- Status Badge -->
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div :class="['text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm', getStatusBadgeClass(photo.status)]">
                {{ getStatusIcon(photo.status) }}
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-20">
          <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-lucide-image-off" class="w-10 h-10 text-gray-400" />
          </div>
          <h3 class="text-lg font-medium text-highlighted mb-2">No photos in this location</h3>
          <UButton @click="goToLocations" color="neutral" variant="ghost">
            <UIcon name="i-lucide-arrow-left" class="mr-2" />
            Back to locations
          </UButton>
        </div>
      </div>
    </div>

    <!-- Floating Upload Button -->
    <div 
      v-if="event" 
      class="fixed right-8 z-50 transition-all duration-300"
      :class="uploadStats.total > 0 ? 'bottom-24' : 'bottom-8'"
    >
      <UButton
        color="primary"
        size="xl"
        class="shadow-lg"
        @click="showUploadDrawer = true"
      >
        <UIcon name="i-lucide-upload" class="mr-2" />
        Upload Photos
      </UButton>
    </div>

    <!-- Upload Progress Bar (Bottom) -->
    <div 
      v-if="uploadStats.total > 0" 
      class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t-2 border-primary-500 shadow-2xl z-40"
    >
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <UIcon 
              name="i-lucide-loader-circle" 
              class="w-5 h-5 text-primary-500 animate-spin flex-shrink-0"
              v-if="isUploading"
            />
            <UIcon 
              name="i-lucide-circle-check" 
              class="w-5 h-5 text-success flex-shrink-0"
              v-else-if="uploadStats.success === uploadStats.total"
            />
            <UIcon 
              name="i-lucide-circle-alert" 
              class="w-5 h-5 text-error flex-shrink-0"
              v-else
            />
            
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 text-sm font-medium text-highlighted">
                <span>{{ isUploading ? 'Uploading photos...' : 'Upload complete' }}</span>
                <span class="text-muted">·</span>
                <span class="text-success">{{ uploadStats.success }}</span>
                <span class="text-muted">/</span>
                <span>{{ uploadStats.total }}</span>
              </div>
              <div class="flex items-center gap-3 mt-1">
                <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div 
                    class="h-full bg-primary-500 transition-all duration-300"
                    :style="{ width: `${(uploadStats.success / uploadStats.total) * 100}%` }"
                  ></div>
                </div>
                <span class="text-xs text-muted whitespace-nowrap">
                  {{ Math.round((uploadStats.success / uploadStats.total) * 100) }}%
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <UButton
              v-if="uploadStats.error > 0"
              color="error"
              variant="soft"
              size="sm"
              @click="showUploadDrawer = true"
            >
              {{ uploadStats.error }} Failed
            </UButton>
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              @click="showUploadDrawer = true"
            >
              View Details
            </UButton>
            <UButton
              v-if="!isUploading"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="sm"
              square
              @click="clearQueue"
            />
          </div>
        </div>
      </div>
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
                <div class="text-sm font-medium text-highlighted mb-1">Uploading to</div>
                <div class="font-semibold text-highlighted">{{ event.name }}</div>
              </div>
            </div>
          </div>

          <!-- Location Selection -->
          <div v-if="event">
            <label class="text-sm font-medium text-highlighted mb-2 block">Location (Optional)</label>
            <USelectMenu
              v-model="uploadLocation"
              :items="uploadLocations"
              label-key="name"
              placeholder="Choose location... (optional)"
              class="w-full"
              :loading="loadingUploadLocations"
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
              <UIcon name="i-lucide-image" class="w-12 h-12 mx-auto mb-3 text-dimmed" />
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

            <div class="space-y-2 max-h-96 overflow-y-auto">
              <div
                v-for="[key, progress] in Array.from(uploadQueue)"
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
                      {{ progress.file.name }}
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

            <div class="flex gap-2 mt-4">
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
          </div>
        </div>
      </template>
    </USlideover>

    <!-- Photo Detail Modal -->
    <UModal 
      v-if="selectedPhoto"
      v-model:open="showPhotoModal" 
      :title="selectedPhoto.event_name || 'Photo Details'"
      :description="formatDate(selectedPhoto.created_at)"
      :ui="{ content: 'max-w-5xl' }"
    >
      <template #body>
        <div class="grid grid-cols-3 h-[600px]">
          <div class="col-span-2 bg-black flex items-center justify-center">
            <img
              :src="getPhotoUrl(selectedPhoto.photo_path)"
              :alt="`Photo ${selectedPhoto.id}`"
              class="max-w-full max-h-full object-contain"
            />
          </div>

          <div class="border-l border-gray-200 dark:border-gray-700 overflow-y-auto pl-6 space-y-4">
            <div>
              <div class="text-xs text-muted mb-1">Status</div>
              <div :class="['inline-flex items-center gap-2 text-sm px-2 py-1 rounded-full font-medium', getStatusBadgeClass(selectedPhoto.status)]">
                {{ getStatusIcon(selectedPhoto.status) }} {{ getStatusText(selectedPhoto.status) }}
              </div>
            </div>
            <div>
              <div class="text-xs text-muted mb-1">Event</div>
              <div class="text-sm font-medium text-highlighted">
                {{ selectedPhoto.event_name || 'N/A' }}
              </div>
            </div>
            <div>
              <div class="text-xs text-muted mb-1">Location</div>
              <div class="text-sm font-medium text-highlighted">
                {{ selectedPhoto.location_name || 'No location' }}
              </div>
            </div>
            <div v-if="selectedPhoto.error_message" class="bg-error/10 p-3 rounded">
              <div class="text-xs text-error mb-1">Error</div>
              <div class="text-xs text-error/80">{{ selectedPhoto.error_message }}</div>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Event, PhotoLocation } from '~/types'

const route = useRoute()
const eventId = route.params.eventId as string

// Composables
const { user, fetchUser } = useUser()
const { auth, supabase } = useSupabase()
const { 
  uploadQueue, 
  isUploading, 
  uploadPhotosWithConcurrency,
  uploadStats,
  clearQueue,
  retryFailed
} = usePhotoUpload()

// Navigation state
const currentView = ref<'locations' | 'photos'>('locations')

// State
const event = ref<Event | null>(null)
const locationFolders = ref<any[]>([])
const photos = ref<any[]>([])
const selectedLocation = ref<PhotoLocation | null>(null)
const selectedPhoto = ref<any | null>(null)
const isLoadingEvent = ref(true)
const loadingLocations = ref(false)
const loadingPhotos = ref(false)
const showPhotoModal = ref(false)
const eventPhotoCount = ref(0)

// Upload drawer state
const showUploadDrawer = ref(false)
const uploadLocation = ref<PhotoLocation | null>(null)
const uploadLocations = ref<PhotoLocation[]>([])
const loadingUploadLocations = ref(false)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()

// Dynamic title
useHead(() => ({
  title: event.value ? `${event.value.name} - Racetify Photos` : 'Event - Racetify Photos'
}))

// Watch upload completion to refresh current view
watch(() => uploadStats.value.success, async (newCount, oldCount) => {
  if (newCount > oldCount) {
    if (currentView.value === 'locations') {
      await fetchLocationFolders()
    } else if (currentView.value === 'photos') {
      await fetchPhotos()
    }
  }
})

// Fetch data on mount
onMounted(async () => {
  // await fetchUser()
    await fetchEvent()
    await fetchLocationFolders()
    await fetchUploadLocations()
})

/**
 * Fetch event details
 */
const fetchEvent = async () => {
  try {
    isLoadingEvent.value = true
    const data = await $fetch<Event>(`/api/events/${eventId}`)
    event.value = data
  } catch (error: any) {
    console.error('Failed to fetch event:', error)
    event.value = null
  } finally {
    isLoadingEvent.value = false
  }
}

/**
 * Fetch location folders for selected event
 */
const fetchLocationFolders = async () => {
  try {
    loadingLocations.value = true
    
    if (!user.value) return

    const { data: { session } } = await auth.getSession()
    if (!session) throw new Error('No active session')

    const locationsData = await $fetch<PhotoLocation[]>(
      `/api/events/${eventId}/locations`,
      { headers: { Authorization: `Bearer ${session.access_token}` } }
    )

    const foldersWithCounts = await Promise.all(
      locationsData.map(async (location) => {
        const { count } = await $fetch<{ count: number }>(
          `/api/events/${eventId}/photo-count?location_id=${location.id}`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        ).catch(() => ({ count: 0 }))
        
        return {
          ...location,
          photoCount: count
        }
      })
    )

    locationFolders.value = foldersWithCounts.filter(f => f.photoCount > 0)

    const { count } = await $fetch<{ count: number }>(
      `/api/events/${eventId}/photo-count`,
      { headers: { Authorization: `Bearer ${session.access_token}` } }
    ).catch(() => ({ count: 0 }))
    
    eventPhotoCount.value = count

  } catch (error) {
    console.error('Failed to fetch location folders:', error)
    locationFolders.value = []
  } finally {
    loadingLocations.value = false
  }
}

/**
 * Open location photos or all event photos
 */
const openLocationPhotos = async (location: any | null) => {
  selectedLocation.value = location
  uploadLocation.value = location
  currentView.value = 'photos'
  await fetchPhotos()
}

/**
 * Fetch photos for selected location or all event photos
 */
const fetchPhotos = async () => {
  try {
    loadingPhotos.value = true
    
    if (!user.value) return

    const { data: { session } } = await auth.getSession()
    if (!session) throw new Error('No active session')

    let url = `/api/events/${eventId}/photos`
    if (selectedLocation.value) {
      url += `?location_id=${selectedLocation.value.id}`
    }

    const data = await $fetch<any[]>(url, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })

    photos.value = data || []

  } catch (error) {
    console.error('Failed to fetch photos:', error)
    photos.value = []
  } finally {
    loadingPhotos.value = false
  }
}

/**
 * Navigation functions
 */
const goToLocations = () => {
  currentView.value = 'locations'
  selectedLocation.value = null
  uploadLocation.value = null
  photos.value = []
}

/**
 * Fetch locations for upload drawer
 */
const fetchUploadLocations = async () => {
  try {
    loadingUploadLocations.value = true
    
    const { data: { session } } = await auth.getSession()
    if (!session) throw new Error('No active session')

    const data = await $fetch<PhotoLocation[]>(`/api/events/${eventId}/locations`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })

    uploadLocations.value = data
  } catch (error) {
    console.error('Failed to fetch upload locations:', error)
    uploadLocations.value = []
  } finally {
    loadingUploadLocations.value = false
  }
}

/**
 * Handle file drop
 */
const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  
  const files = Array.from(event.dataTransfer?.files || [])
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length > 0 && user.value) {
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
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  
  if (files.length > 0 && user.value) {
    startUpload(files)
  }
  
  if (target) {
    target.value = ''
  }
}

/**
 * Start upload process
 */
const startUpload = async (files: File[]) => {
  if (!user.value) return

  try {
    await uploadPhotosWithConcurrency(
      files,
      eventId,
      user.value.id,
      3,
      uploadLocation.value?.id
    )
  } catch (error) {
    console.error('Upload failed:', error)
  }
}

/**
 * Retry failed uploads
 */
const handleRetryFailed = async () => {
  if (!user.value) return
  
  await retryFailed(eventId, user.value.id, uploadLocation.value?.id)
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

/**
 * Get photo URL from storage
 */
const getPhotoUrl = (photoPath: string) => {
  const { data } = supabase.storage.from('event-photos').getPublicUrl(photoPath)
  return data.publicUrl
}

/**
 * Handle image error
 */
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E'
}

/**
 * Open photo detail modal
 */
const openPhotoDetail = (photo: any) => {
  selectedPhoto.value = photo
  showPhotoModal.value = true
}

/**
 * Get status badge class
 */
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-success/20 text-success'
    case 'processing':
      return 'bg-info/20 text-info'
    case 'pending':
      return 'bg-warning/20 text-warning'
    case 'failed':
      return 'bg-error/20 text-error'
    default:
      return 'bg-gray-500/20 text-gray-500'
  }
}

/**
 * Get status text
 */
const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'processing':
      return 'Processing'
    case 'pending':
      return 'Pending'
    case 'failed':
      return 'Failed'
    default:
      return status
  }
}

/**
 * Get status icon
 */
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return '✓'
    case 'processing':
      return '⟳'
    case 'pending':
      return '⋯'
    case 'failed':
      return '✕'
    default:
      return '•'
  }
}

/**
 * Handle logout
 */
const handleLogout = async () => {
  await auth.signOut()
  navigateTo('/login')
}

/**
 * Format date
 */
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}
</script>
