<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Albums View (Events) -->
      <div>
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-highlighted mb-2">Albums</h2>
          <p class="text-muted">Your event albums</p>
        </div>

        <div v-if="loadingEvents" class="flex justify-center py-20">
          <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary-500" />
        </div>

        <div v-else-if="eventAlbums.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="album in eventAlbums"
            :key="album.id"
            class="group cursor-pointer"
            @click="openEventAlbum(album)"
          >
            <!-- Album Cover -->
            <div class="relative aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mb-3 group-hover:ring-2 group-hover:ring-primary-500 transition-all">
              <img
                v-if="album.coverPhoto"
                :src="getPhotoUrl(album.coverPhoto)"
                :alt="album.name"
                class="w-full h-full object-cover"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <div class="text-center">
                  <UIcon name="i-lucide-image" class="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p class="text-xs text-gray-500">No photos yet</p>
                </div>
              </div>
              
              <!-- Photo Count Badge -->
              <div v-if="album.photoCount > 0" class="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                {{ album.photoCount }} {{ album.photoCount === 1 ? 'photo' : 'photos' }}
              </div>
              
              <!-- Empty Badge -->
              <div v-else class="absolute top-2 right-2 bg-amber-500/90 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                Empty
              </div>
            </div>

            <!-- Album Info -->
            <h3 class="font-medium text-highlighted mb-1 group-hover:text-primary-500 transition-colors">
              {{ album.name }}
            </h3>
          </div>
        </div>

        <div v-else class="text-center py-20">
          <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-lucide-folder-open" class="w-10 h-10 text-gray-400" />
          </div>
          <h3 class="text-lg font-medium text-highlighted mb-2">No albums yet</h3>
          <p class="text-muted">Upload photos from an event to create your first album</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Event } from '~/types'

definePageMeta({
  middleware: 'photographer'
})

useHead({
  title: 'Photos - Racetify Photos'
})

// Composables
const user = useSupabaseUser()
const { supabase } = useSupabase()
const { authFetch } = useAuthFetch()

// State
const eventAlbums = ref<any[]>([])
const loadingEvents = ref(false)

// Fetch data on mount
onMounted(async () => {
  if (user.value) {
    await fetchEventAlbums()
  }
})

/**
 * Fetch event albums with photo counts
 * Only fetch events where user is photographer from event_crews
 */
const fetchEventAlbums = async () => {
  try {
    loadingEvents.value = true
    
    if (!user.value) return

    // Fetch events where user is photographer from event_crews
    const eventsData = await authFetch<Event[]>('/api/events/photographer')

    // Fetch photo counts and cover photos for each event
    const albumsWithCounts = await Promise.all(
      eventsData.map(async (event) => {
        const [coverPhotoRes, photoCountRes] = await Promise.all([
          authFetch(`/api/events/${event.id}/cover-photo`).catch(() => ({ photo_path: null, created_at: null })),
          authFetch<{ count: number }>(`/api/events/${event.id}/photo-count`).catch(() => ({ count: 0 }))
        ])

        return {
          ...event,
          photoCount: photoCountRes.count,
          coverPhoto: coverPhotoRes.photo_path
        }
      })
    )

    // Show all albums even if photoCount is 0
    eventAlbums.value = albumsWithCounts
  } catch (error) {
    console.error('Failed to fetch event albums:', error)
  } finally {
    loadingEvents.value = false
  }
}

/**
 * Open event album (navigate to event detail page)
 */
const openEventAlbum = async (album: any) => {
  navigateTo(`/photographer/${album.id}`)
}

/**
 * Get photo URL from storage
 */
const getPhotoUrl = (photoPath: string) => {
  const { data } = supabase.storage.from('event-photos').getPublicUrl(photoPath)
  return data.publicUrl
}
</script>
