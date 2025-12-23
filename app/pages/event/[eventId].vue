<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-arrow-left"
              to="/"
              size="sm"
            />
            <div>
              <h1 class="text-xl font-semibold text-highlighted">
                {{ event?.name || 'Loading...' }}
              </h1>
              <p v-if="event?.location" class="text-sm text-muted">{{ event.location }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Search Section -->
      <div class="mb-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-start gap-4 mb-6">
          <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-search" class="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-highlighted mb-1">Find Your Race Photos</h2>
            <p class="text-sm text-muted">Search by bib number or upload a selfie to find photos</p>
          </div>
        </div>

        <!-- Search Tabs -->
        <div class="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            class="px-4 py-2 text-sm font-medium transition-colors"
            :class="searchMode === 'bib' 
              ? 'text-primary-500 border-b-2 border-primary-500' 
              : 'text-muted hover:text-highlighted'"
            @click="searchMode = 'bib'"
          >
            <UIcon name="i-lucide-hash" class="mr-2" />
            Search by Bib
          </button>
          <button
            class="px-4 py-2 text-sm font-medium transition-colors"
            :class="searchMode === 'selfie' 
              ? 'text-primary-500 border-b-2 border-primary-500' 
              : 'text-muted hover:text-highlighted'"
            @click="searchMode = 'selfie'"
          >
            <UIcon name="i-lucide-camera" class="mr-2" />
            Search by Selfie
          </button>
        </div>

        <!-- Bib Search Form -->
        <div v-if="searchMode === 'bib'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-highlighted mb-2">
              Bib Number
            </label>
            <div class="flex gap-2">
              <UInput
                v-model="bibNumber"
                type="text"
                placeholder="Enter your bib number (e.g., 1234)"
                size="lg"
                class="flex-1"
                :disabled="isSearching"
                @keyup.enter="searchByBib"
              >
                <template #leading>
                  <UIcon name="i-lucide-hash" class="w-5 h-5 text-muted" />
                </template>
              </UInput>
              <UButton
                color="primary"
                size="lg"
                :loading="isSearching"
                :disabled="!bibNumber || isSearching"
                @click="searchByBib"
              >
                <UIcon name="i-lucide-search" class="mr-2" />
                Search
              </UButton>
            </div>
            <p class="text-xs text-muted mt-2">
              Enter the bib number you wore during the race
            </p>
          </div>
        </div>

        <!-- Selfie Search Form -->
        <div v-else-if="searchMode === 'selfie'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-highlighted mb-2">
              Upload Selfie
            </label>
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
              <UIcon name="i-lucide-user-circle" class="w-16 h-16 mx-auto mb-3 text-dimmed" />
              <p class="text-sm font-medium text-highlighted mb-1">
                Drag & drop your selfie here
              </p>
              <p class="text-xs text-muted mb-3">or</p>
              <UButton
                color="primary"
                size="sm"
                @click="triggerFileInput"
                :disabled="isSearching"
              >
                <UIcon name="i-lucide-upload" class="mr-2" />
                Choose Photo
              </UButton>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileSelect"
              />
              <p class="text-xs text-muted mt-3">
                Upload a clear photo of yourself to find matching race photos
              </p>
            </div>
            
            <!-- Uploaded Selfie Preview -->
            <div v-if="uploadedSelfie" class="mt-4 flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <img
                :src="uploadedSelfie"
                alt="Uploaded selfie"
                class="w-16 h-16 rounded-lg object-cover"
              />
              <div class="flex-1">
                <p class="text-sm font-medium text-highlighted">Selfie uploaded</p>
                <p class="text-xs text-muted">Ready to search</p>
              </div>
              <UButton
                color="error"
                variant="soft"
                size="sm"
                icon="i-lucide-x"
                @click="clearSelfie"
              />
            </div>

            <!-- Search Button for Selfie -->
            <UButton
              v-if="uploadedSelfie"
              color="primary"
              size="lg"
              block
              :loading="isSearching"
              :disabled="isSearching"
              @click="searchBySelfie"
              class="mt-4"
            >
              <UIcon name="i-lucide-search" class="mr-2" />
              Find My Photos
            </UButton>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isSearching" class="text-center py-20">
        <UIcon name="i-lucide-loader-circle" class="w-12 h-12 animate-spin text-primary-500 mb-4 mx-auto" />
        <p class="text-lg font-medium text-highlighted mb-2">Searching for your photos...</p>
        <p class="text-sm text-muted">This may take a few moments</p>
      </div>

      <!-- No Search Performed (Default State) -->
      <div v-else-if="!searchPerformed" class="text-center py-20">
        <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-lucide-image-off" class="w-10 h-10 text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-highlighted mb-2">No photos to display</h3>
        <p class="text-muted">
          {{ searchMode === 'bib' 
            ? 'Enter your bib number above to find your race photos' 
            : 'Upload a selfie to find photos where you appear' }}
        </p>
      </div>

      <!-- Search Results -->
      <div v-else-if="searchPerformed">
        <!-- No Results -->
        <div v-if="photos.length === 0" class="text-center py-20">
          <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-lucide-search-x" class="w-10 h-10 text-gray-400" />
          </div>
          <h3 class="text-lg font-medium text-highlighted mb-2">No photos found</h3>
          <p class="text-muted mb-4">
            {{ searchMode === 'bib' 
              ? `No photos found with bib number "${bibNumber}"` 
              : 'No matching photos found with your selfie' }}
          </p>
          <p class="text-sm text-muted mb-6">
            Photos may still be processing or your bib number may be incorrect
          </p>
          <UButton
            color="primary"
            variant="outline"
            @click="resetSearch"
          >
            <UIcon name="i-lucide-rotate-ccw" class="mr-2" />
            Try Another Search
          </UButton>
        </div>

        <!-- Photo Grid -->
        <div v-else>
          <div class="mb-6 flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-highlighted mb-1">
                {{ photos.length }} {{ photos.length === 1 ? 'Photo' : 'Photos' }} Found
              </h3>
              <p class="text-sm text-muted">
                {{ searchMode === 'bib' 
                  ? `Photos with bib number "${bibNumber}"` 
                  : 'Photos matching your selfie' }}
              </p>
            </div>
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              @click="resetSearch"
            >
              <UIcon name="i-lucide-rotate-ccw" class="mr-2" />
              New Search
            </UButton>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              
              <!-- Hover Overlay -->
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <UIcon name="i-lucide-zoom-in" class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <!-- Location Badge -->
              <div v-if="photo.location_name" class="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1 text-xs text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                <UIcon name="i-lucide-map-pin" class="w-3 h-3 inline mr-1" />
                {{ photo.location_name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Photo Detail Modal -->
    <UModal 
      v-if="selectedPhoto"
      v-model:open="showPhotoModal" 
      :title="event?.name || 'Photo Details'"
      :ui="{ content: 'max-w-5xl' }"
    >
      <template #body>
        <div class="grid grid-cols-3 h-[600px]">
          <!-- Photo Preview -->
          <div class="col-span-2 bg-black flex items-center justify-center">
            <img
              :src="getPhotoUrl(selectedPhoto.photo_path)"
              :alt="`Photo ${selectedPhoto.id}`"
              class="max-w-full max-h-full object-contain"
            />
          </div>

          <!-- Details Sidebar -->
          <div class="border-l border-gray-200 dark:border-gray-700 overflow-y-auto pl-6 space-y-4">
            <div>
              <div class="text-xs text-muted mb-1">Event</div>
              <div class="text-sm font-medium text-highlighted">
                {{ event?.name || 'N/A' }}
              </div>
            </div>
            <div v-if="selectedPhoto.location_name">
              <div class="text-xs text-muted mb-1">Location</div>
              <div class="text-sm font-medium text-highlighted">
                {{ selectedPhoto.location_name }}
              </div>
            </div>
            <div v-if="selectedPhoto.bib_numbers && selectedPhoto.bib_numbers.length > 0">
              <div class="text-xs text-muted mb-1">Bib Numbers</div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="bib in selectedPhoto.bib_numbers"
                  :key="bib"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                >
                  #{{ bib }}
                </span>
              </div>
            </div>
            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
              <UButton
                color="primary"
                block
                @click="downloadPhoto(selectedPhoto)"
              >
                <UIcon name="i-lucide-download" class="mr-2" />
                Download Photo
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Event } from '~/types'

// No auth required - public page
definePageMeta({
  middleware: []
})

const route = useRoute()
const eventId = route.params.eventId as string

// Composables
const { supabase } = useSupabase()

// State
const event = ref<Event | null>(null)
const searchMode = ref<'bib' | 'selfie'>('bib')
const bibNumber = ref('')
const uploadedSelfie = ref<string | null>(null)
const selfieFile = ref<File | null>(null)
const photos = ref<any[]>([])
const selectedPhoto = ref<any | null>(null)
const isSearching = ref(false)
const searchPerformed = ref(false)
const showPhotoModal = ref(false)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()

// Dynamic title
useHead(() => ({
  title: event.value ? `${event.value.name} - Find Your Photos` : 'Find Your Photos - Racetify'
}))

// Fetch event data on mount
onMounted(async () => {
  await fetchEvent()
})

/**
 * Fetch event details
 */
const fetchEvent = async () => {
  try {
    const data = await $fetch<Event>(`/api/events/${eventId}`)
    event.value = data
  } catch (error) {
    console.error('Failed to fetch event:', error)
  }
}

/**
 * Search by bib number
 */
const searchByBib = async () => {
  if (!bibNumber.value.trim()) return

  try {
    isSearching.value = true
    searchPerformed.value = true
    
    const data = await $fetch<any[]>('/api/photos/search-by-bib', {
      params: {
        bib: bibNumber.value.trim(),
        eventId: eventId
      }
    })
    
    photos.value = data || []
  } catch (error) {
    console.error('Search failed:', error)
    photos.value = []
  } finally {
    isSearching.value = false
  }
}

/**
 * Handle file drop
 */
const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  
  const files = Array.from(event.dataTransfer?.files || [])
  const imageFile = files.find(file => file.type.startsWith('image/'))
  
  if (imageFile) {
    processUploadedSelfie(imageFile)
  }
}

/**
 * Trigger file input
 */
const triggerFileInput = () => {
  fileInput.value?.click()
}

/**
 * Handle file select
 */
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    processUploadedSelfie(file)
  }
  
  if (target) {
    target.value = ''
  }
}

/**
 * Process uploaded selfie
 */
const processUploadedSelfie = (file: File) => {
  selfieFile.value = file
  
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedSelfie.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

/**
 * Clear selfie
 */
const clearSelfie = () => {
  uploadedSelfie.value = null
  selfieFile.value = null
}

/**
 * Search by selfie (placeholder - requires facial recognition API)
 */
const searchBySelfie = async () => {
  if (!selfieFile.value) return

  try {
    isSearching.value = true
    searchPerformed.value = true
    
    // TODO: Implement facial recognition search
    // For now, show empty results with a message
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    photos.value = []
    
    // You would implement this with a facial recognition API
    // const formData = new FormData()
    // formData.append('selfie', selfieFile.value)
    // formData.append('eventId', eventId)
    // const data = await $fetch('/api/photos/search-by-face', {
    //   method: 'POST',
    //   body: formData
    // })
    // photos.value = data || []
    
  } catch (error) {
    console.error('Selfie search failed:', error)
    photos.value = []
  } finally {
    isSearching.value = false
  }
}

/**
 * Reset search
 */
const resetSearch = () => {
  bibNumber.value = ''
  uploadedSelfie.value = null
  selfieFile.value = null
  photos.value = []
  searchPerformed.value = false
  isSearching.value = false
}

/**
 * Get photo URL
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
 * Open photo detail
 */
const openPhotoDetail = (photo: any) => {
  selectedPhoto.value = photo
  showPhotoModal.value = true
}

/**
 * Download photo
 */
const downloadPhoto = (photo: any) => {
  const url = getPhotoUrl(photo.photo_path)
  const link = document.createElement('a')
  link.href = url
  link.download = `racetify-${eventId}-${photo.id}.jpg`
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>
