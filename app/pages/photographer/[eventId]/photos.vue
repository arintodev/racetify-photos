<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumb -->
      <nav class="mb-6" aria-label="Breadcrumb">
        <ol class="flex items-center space-x-2 text-sm">
          <li class="flex items-center">
            <NuxtLink to="/photographer" class="text-primary-600 hover:text-primary-500 transition-colors">
              Albums
            </NuxtLink>
          </li>
          <li class="flex items-center">
            <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-muted mx-2" />
            <NuxtLink :to="`/photographer/${eventId}`" class="text-primary-600 hover:text-primary-500 transition-colors">
              {{ event?.name || 'Event' }}
            </NuxtLink>
          </li>
          <li class="flex items-center">
            <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-muted mx-2" />
            <span class="text-highlighted font-medium">{{ selectedLocation?.name || 'All Photos' }}</span>
          </li>
        </ol>
      </nav>

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

      <!-- Photos View -->
      <div v-else-if="event">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-highlighted mb-2">
            {{ selectedLocation?.name || 'All Photos' }}
          </h2>
          <p class="text-muted">{{ totalPhotoCount }} {{ totalPhotoCount === 1 ? 'photo' : 'photos' }}</p>
        </div>

        <!-- Loading Photos -->
        <div v-if="loadingPhotos && photos.length === 0" class="flex justify-center py-20">
          <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary-500" />
        </div>

        <!-- No Photos -->
        <div v-else-if="!loadingPhotos && photos.length === 0" class="text-center py-20">
          <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-lucide-image-off" class="w-10 h-10 text-gray-400" />
          </div>
          <h3 class="text-lg font-medium text-highlighted mb-2">No photos found</h3>
          <p class="text-muted">
            {{ selectedLocation ? `No photos found in ${selectedLocation.name}` : 'No photos found in this event' }}
          </p>
        </div>

        <!-- Photo Gallery -->
        <div v-else>
          <NaturalGallery
            :items="galleryItems"
            :loading="loadingPhotos"
            :lightbox="true"
            :selectable="false"
            @pagination="handlePagination"
          />
        </div>
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
// @ts-ignore
import type { Event, PhotoLocation } from '@/types'

definePageMeta({
  middleware: 'photographer'
})

const route = useRoute()
const eventId = route.params.eventId as string

// Composables
const user = useSupabaseUser()
const { authFetch } = useAuthFetch()

// State
const event = ref<Event | null>(null)
const photos = ref<any[]>([])
const selectedLocation = ref<PhotoLocation | null>(null)
const isLoadingEvent = ref(true)
const loadingPhotos = ref(false)
const currentOffset = ref(0)
const hasMorePhotos = ref(true)
const totalPhotoCount = ref(0)

// Upload locations
const uploadLocations = ref<PhotoLocation[]>([])
const loadingUploadLocations = ref(false)

// Dynamic title
useHead(() => ({
  title: event.value ? `${selectedLocation.value?.name || 'All Photos'} - ${event.value.name} - Racetify Photos` : 'Photos - Racetify Photos'
}))

// Fetch data on mount
onMounted(async () => {
  await fetchEvent()
  await fetchSelectedLocation()
  await fetchPhotos(10, 0)
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
 * Fetch selected location details if location query exists
 */
const fetchSelectedLocation = async () => {
  const locationId = route.query.location as string
  if (locationId && user.value) {
    try {
      const locationsData = await authFetch<PhotoLocation[]>(`/api/events/${eventId}/locations`)
      selectedLocation.value = locationsData.find(loc => loc.id === locationId) || null
    } catch (error) {
      console.error('Failed to fetch location:', error)
    }
  }
}

/**
 * Fetch photos for selected location or all event photos
 */
const fetchPhotos = async (limit: number, offset: number) => {
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
      // Fetch total count on initial load
      await fetchTotalPhotoCount()
    } else {
      photos.value = [...photos.value, ...(data || [])]
    }

    // Check if there are more photos to load
    hasMorePhotos.value = data && data.length === limit

  } catch (error) {
    console.error('Failed to fetch photos:', error)
    if (offset === 0) {
      photos.value = []
      totalPhotoCount.value = 0
    }
  } finally {
    loadingPhotos.value = false
  }
}

/**
 * Handle infinite scroll pagination
 */
const handlePagination = async (event: { offset: number; limit: number }) => {
  if (loadingPhotos.value || !hasMorePhotos.value) return
  
  currentOffset.value = event.offset
  await fetchPhotos(event.limit, event.offset)
}

/**
 * Fetch total photo count
 */
const fetchTotalPhotoCount = async () => {
  try {
    let url = `/api/events/${eventId}/photo-count`
    if (selectedLocation.value) {
      url += `?location_id=${selectedLocation.value.id}`
    }

    const { count } = await authFetch<{ count: number }>(url)
    totalPhotoCount.value = count
  } catch (error) {
    console.error('Failed to fetch total photo count:', error)
    totalPhotoCount.value = 0
  }
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
  // Reload photos from beginning
  currentOffset.value = 0
  hasMorePhotos.value = true
  await fetchPhotos(10, 0)
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