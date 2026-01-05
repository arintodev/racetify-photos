<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
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

        <!-- Natural Gallery Grid Component -->
        <NaturalGallery
          :items="galleryItems"
          :loading="loadingPhotos"
          :lightbox="true"
          :selectable="false"
          @pagination="handlePagination"
        />
      </div>
    </div>

    <!-- Photo Upload Component -->
    <PhotoUploadDrawer
      :event="event"
      :locations="uploadLocations"
      :loading-locations="loadingUploadLocations"
      :initial-location="selectedLocation"
      @upload-complete="handleUploadComplete"
    />
  </div>
</template>

<script setup lang="ts">
import type { Event, PhotoLocation } from '~/types'

definePageMeta({
  middleware: 'photographer'
})

const route = useRoute()
const eventId = route.params.eventId as string

// Composables
const user = useSupabaseUser()
const { authFetch } = useAuthFetch()

// Navigation state
const currentView = ref<'locations' | 'photos'>('locations')

// State
const event = ref<Event | null>(null)
const locationFolders = ref<any[]>([])
const photos = ref<any[]>([])
const selectedLocation = ref<PhotoLocation | null>(null)
const isLoadingEvent = ref(true)
const loadingLocations = ref(false)
const loadingPhotos = ref(false)
const eventPhotoCount = ref(0)
const currentOffset = ref(0)
const hasMorePhotos = ref(true)

// Upload locations
const uploadLocations = ref<PhotoLocation[]>([])
const loadingUploadLocations = ref(false)

// Dynamic title
useHead(() => ({
  title: event.value ? `${event.value.name} - Racetify Photos` : 'Event - Racetify Photos'
}))

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

    const locationsData = await authFetch<PhotoLocation[]>(`/api/events/${eventId}/locations`)

    const foldersWithCounts = await Promise.all(
      locationsData.map(async (location) => {
        const { count } = await authFetch<{ count: number }>(
          `/api/events/${eventId}/photo-count?location_id=${location.id}`
        ).catch(() => ({ count: 0 }))
        
        return {
          ...location,
          photoCount: count
        }
      })
    )

    locationFolders.value = foldersWithCounts.filter(f => f.photoCount > 0)

    const { count } = await authFetch<{ count: number }>(
      `/api/events/${eventId}/photo-count`
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
  currentView.value = 'photos'
  // Reset pagination state
  currentOffset.value = 0
  photos.value = []
  hasMorePhotos.value = true
  // Pagination will be triggered by NaturalGallery component
  fetchPhotos(10, 0)
}

/**
 * Fetch photos for selected location or all event photos
 */
const fetchPhotos = async (limit: number, offset: number) => {
  console.log('Fetching photos:', { limit, offset })
  try {
    loadingPhotos.value = true
    
    if (!user.value) return

    let url = `/api/events/${eventId}/photos?limit=${limit}&offset=${offset}`
    if (selectedLocation.value) {
      url += `&location_id=${selectedLocation.value.id}`
    }

    const data = await authFetch<any[]>(url)

    if (offset === 0) {
      photos.value = data || []
    } else {
      photos.value = [...photos.value, ...(data || [])]
    }

    // Check if there are more photos to load
    hasMorePhotos.value = data && data.length === limit

  } catch (error) {
    console.error('Failed to fetch photos:', error)
    if (offset === 0) {
      photos.value = []
    }
  } finally {
    loadingPhotos.value = false
  }
}

/**
 * Handle infinite scroll pagination
 */
const handlePagination = async (event: { offset: number; limit: number }) => {
  console.log('Handle pagination:', loadingPhotos.value, hasMorePhotos.value);
  if (loadingPhotos.value || !hasMorePhotos.value) return
  
  currentOffset.value = event.offset
  await fetchPhotos(event.limit, event.offset)
}

/**
 * Navigation functions
 */
const goToLocations = () => {
  currentView.value = 'locations'
  selectedLocation.value = null
  photos.value = []
  currentOffset.value = 0
  hasMorePhotos.value = true
}

/**
 * Fetch locations for upload drawer
 */
const fetchUploadLocations = async () => {
  try {
    loadingUploadLocations.value = true
    
    const data = await authFetch<PhotoLocation[]>(`/api/events/${eventId}/locations`)

    uploadLocations.value = data
  } catch (error) {
    console.error('Failed to fetch upload locations:', error)
    uploadLocations.value = []
  } finally {
    loadingUploadLocations.value = false
  }
}

/**
 * Handle upload complete from component
 */
const handleUploadComplete = async () => {
  if (currentView.value === 'locations') {
    await fetchLocationFolders()
  } else if (currentView.value === 'photos') {
    // Reload photos from beginning
    currentOffset.value = 0
    hasMorePhotos.value = true
    await fetchPhotos(4, 0)
  }
}

/**
 * Prepare gallery items from photos
 */
const galleryItems = computed(() => {
  return photos.value.map(photo => ({
    id: photo.id,
    imageUrl: photo.public_url,
    thumbnailUrl: photo.public_url,
    alt: `Photo ${photo.id}`,
    width: photo.width,
    height: photo.height
  }))
})
</script>
