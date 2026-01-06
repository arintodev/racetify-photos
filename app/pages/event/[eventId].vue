<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
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
            <h1 class="text-lg font-semibold text-highlighted">
              {{ event?.name || 'Loading...' }}
            </h1>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <!-- Banner Section -->
      <div class="mb-4 md:mb-6" v-if="event?.photo_banner_url">
        <div
          class="w-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden"
        >
          <img
            :src="event.photo_banner_url"
            :alt="`${event.name} Banner`"
            class="w-full h-full object-cover"
            @error="handleImageError"
          />
        </div>
      </div>
      <!-- Search Section -->
      <div class="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center gap-4 mb-4">
          <UIcon name="i-lucide-search" class="w-4 h-4 text-primary-500" />
          <div>
            <h2 class="font-semibold text-highlighted">Find Your Race Photos</h2>
          </div>
        </div>

        <!-- Search Tabs -->
        <div class="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
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
        </div>

        <!-- Bib Search Form -->
        <div v-if="searchMode === 'bib'" class="space-y-4">
          <div>
            <div class="flex gap-2">
              <UInput
                v-model="bibNumber"
                type="text"
                placeholder="Enter your bib number (e.g., 1234)"
                size="lg"
                class="flex-1"
                :disabled="isSearching"
                @keyup.enter="() => searchByBib()"
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
                @click="() => searchByBib()"
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
      <div v-else-if="!searchPerformed">
        <div v-if="photos.length === 0" class="text-center py-20">
          <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center mx-auto mb-4 justify-center">
            <UIcon name="i-lucide-image-off" class="w-10 h-10 text-gray-400" />
          </div>
          <h3 class="text-lg font-medium text-highlighted mb-2">No photos to display</h3>
          <p class="text-muted">
            {{ searchMode === 'bib' 
              ? 'Enter your bib number above to find your race photos' 
              : 'Upload a selfie to find photos where you appear' }}
          </p>
        </div>
        <div v-else>
          <div class="mb-6 flex items-center justify-between">
            <div>
              <p class="text-sm text-muted">
                All public photos for this event
              </p>
            </div>
          </div>
          <NaturalGallery
            :items="galleryItems"
            :loading="isLoadingMore"
            :lightbox="true"
            :selectable="false"
            @pagination="handlePagination"
          />
          <div ref="scrollContainer" class="h-20 flex items-center justify-center mt-4">
            <UIcon v-if="isLoadingMore" name="i-lucide-loader-circle" class="w-6 h-6 animate-spin text-primary-500" />
          </div>
        </div>
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

          <NaturalGallery
            :items="galleryItems"
            :loading="isLoadingMore"
            :lightbox="true"
            :selectable="false"
            @pagination="handlePagination"
          />

          <!-- Infinite Scroll Trigger -->
          <div ref="scrollContainer" class="h-20 flex items-center justify-center mt-4">
            <UIcon v-if="isLoadingMore" name="i-lucide-loader-circle" class="w-6 h-6 animate-spin text-primary-500" />
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
              :src="selectedPhoto.public_url"
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

// Pagination state
const hasMorePhotos = ref(true)
const isLoadingMore = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)
const lastFetchedOffset = ref(-1)

// Computed property for gallery items
const galleryItems = computed(() => {
  return photos.value.map(photo => ({
    id: photo.id,
    imageUrl: photo.public_url,
    thumbnailUrl: photo.public_url,
    alt: `Photo ${photo.id}`,
    width: photo.width,
    height: photo.height,
    title: photo.location_name || '',
    ...photo
  }))
})

// Dynamic title
useHead(() => ({
  title: event.value ? `${event.value.name} - Find Your Photos` : 'Find Your Photos - Racetify'
}))

/**
 * Handle pagination from NaturalGallery
 */
const handlePagination = async (event: { offset: number; limit: number }) => {
  if (isLoadingMore.value || !hasMorePhotos.value) return
  
  // Skip if offset is 0 (initial search already fetched this)
  if (event.offset === 0) return
  
  // Prevent duplicate requests with same offset
  if (event.offset === lastFetchedOffset.value) return

  if (!searchPerformed.value) {
    await fetchPublicPhotos(event.limit, event.offset)
    return
  }
  
  if (searchMode.value === 'bib') {
    await searchByBib(event.limit, event.offset)
  }
}

// Fetch event data on mount
onMounted(async () => {
  await fetchEvent()
  if (!searchPerformed.value) {
    await fetchPublicPhotos()
  }
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

const fetchPublicPhotos = async (limit = 10, offset = 0) => {
  const isInitialSearch = offset === 0
  
  if (isInitialSearch) {
    photos.value = []
    hasMorePhotos.value = true
    lastFetchedOffset.value = -1
  } else {
    isLoadingMore.value = true
  }

  try {
    const data = await $fetch<Event>(`/api/events/${eventId}/public-photos`, {
      params: {
        bib: bibNumber.value.trim(),
        limit: limit,
        offset: offset
      }
    })
    if (isInitialSearch) {
      photos.value = data || []
    } else {
      photos.value = [...photos.value, ...(data || [])]
    }

    lastFetchedOffset.value = offset
    hasMorePhotos.value = data && data.length === limit
  } catch (error) {
    console.error('Failed to fetch photos:', error)
  } finally {
    isSearching.value = false
    isLoadingMore.value = false
  }
}

/**
 * Search by bib number
 */
const searchByBib = async (limit = 10, offset = 0) => {
  if (!bibNumber.value.trim()) {
    return
  }

  const isInitialSearch = offset === 0
  
  try {
    searchPerformed.value = true
    
    if (isInitialSearch) {
      isSearching.value = true
      photos.value = []
      hasMorePhotos.value = true
      lastFetchedOffset.value = -1
    } else {
      isLoadingMore.value = true
    }
    
    const data = await $fetch<any[]>(`/api/events/${eventId}/search-by-bib`, {
      params: {
        bib: bibNumber.value.trim(),
        limit: limit,
        offset: offset
      }
    })
    
    if (isInitialSearch) {
      photos.value = data || []
    } else {
      photos.value = [...photos.value, ...(data || [])]
    }
    
    lastFetchedOffset.value = offset
    hasMorePhotos.value = data && data.length === limit
  } catch (error) {
    console.error('Search failed:', error)
    if (isInitialSearch) {
      photos.value = []
    }
  } finally {
    isSearching.value = false
    isLoadingMore.value = false
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
const resetSearch = async () => {
  bibNumber.value = ''
  uploadedSelfie.value = null
  selfieFile.value = null
  photos.value = []
  searchPerformed.value = false
  isSearching.value = false
  lastFetchedOffset.value = -1
  await fetchPublicPhotos()
}

/**
 * Handle image error
 */
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E'
}

/**
 * Download photo
 */
const downloadPhoto = (photo: any) => {
  const url = photo.public_url
  const link = document.createElement('a')
  link.href = url
  link.download = `racetify-${eventId}-${photo.id}.jpg`
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>
