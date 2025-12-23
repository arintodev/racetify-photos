<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="bg-primary shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-white">Racetify Photos</h1>
            <p class="text-sm text-gray-200 mt-1">Temukan foto race Anda</p>
          </div>
          <div class="flex gap-2">
            <UButton
              v-if="isAuthenticated"
              color="primary"
              variant="solid"
              to="/gallery"
            >
              <UIcon name="i-heroicons-photo" />
              Gallery
            </UButton>
            <UButton
              v-else
              color="primary"
              variant="outline"
              to="/login"
            >
              <UIcon name="i-heroicons-arrow-right-on-rectangle" />
              Login
            </UButton>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Hero Section -->
      <div class="text-center mb-12">
        <UIcon name="i-heroicons-camera" class="text-6xl text-primary mx-auto mb-4" />
        <h2 class="text-2xl font-bold text-highlighted mb-3">
          Pilih Event untuk Mencari Foto Anda
        </h2>
        <p class="text-muted max-w-2xl mx-auto">
          Pilih event yang Anda ikuti, lalu masukkan nomor bib untuk menemukan foto race Anda
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="text-4xl text-primary animate-spin mb-4" />
        <p class="text-muted">Memuat daftar event...</p>
      </div>

      <!-- Events Grid -->
      <div v-else-if="events.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard
          v-for="event in events"
          :key="event.id"
          class="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105"
          @click="selectEvent(event)"
        >
          <!-- Event Icon -->
          <div class="flex items-center gap-4 mb-4">
            <div class="w-14 h-14 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <UIcon name="i-heroicons-flag" class="text-2xl text-white" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-highlighted truncate">
                {{ event.name }}
              </h3>
              <p v-if="event.date" class="text-sm text-muted">
                {{ formatDate(event.date) }}
              </p>
            </div>
          </div>

          <!-- Event Details -->
          <div class="space-y-2">
            <div v-if="event.location" class="flex items-center gap-2 text-sm text-muted">
              <UIcon name="i-heroicons-map-pin" class="flex-shrink-0" />
              <span class="truncate">{{ event.location }}</span>
            </div>
            <div v-if="event.description" class="text-sm text-muted line-clamp-2">
              {{ event.description }}
            </div>
          </div>

          <!-- Action Button -->
          <template #footer>
            <UButton
              color="primary"
              block
              @click="selectEvent(event)"
            >
              <UIcon name="i-heroicons-magnifying-glass" />
              Cari Foto
            </UButton>
          </template>
        </UCard>
      </div>

      <!-- Empty State -->
      <UCard v-else class="text-center py-12">
        <UIcon name="i-heroicons-calendar-days" class="text-6xl text-muted mb-4 mx-auto" />
        <h3 class="text-xl font-medium text-highlighted mb-2">
          Belum Ada Event
        </h3>
        <p class="text-muted">
          Saat ini belum ada event yang tersedia
        </p>
      </UCard>

      <!-- Info Section -->
      <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="text-center p-6">
          <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <UIcon name="i-heroicons-numbered-list" class="text-2xl text-primary" />
          </div>
          <h4 class="font-semibold text-highlighted mb-2">1. Pilih Event</h4>
          <p class="text-sm text-muted">Pilih event race yang Anda ikuti</p>
        </div>
        <div class="text-center p-6">
          <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <UIcon name="i-heroicons-hashtag" class="text-2xl text-primary" />
          </div>
          <h4 class="font-semibold text-highlighted mb-2">2. Masukkan Bib</h4>
          <p class="text-sm text-muted">Input nomor bib Anda</p>
        </div>
        <div class="text-center p-6">
          <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <UIcon name="i-heroicons-arrow-down-tray" class="text-2xl text-primary" />
          </div>
          <h4 class="font-semibold text-highlighted mb-2">3. Download Foto</h4>
          <p class="text-sm text-muted">Temukan dan download foto Anda</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Event } from '~/types'

// Meta tags
useHead({
  title: 'Racetify Photos - Cari Foto Race Anda',
  meta: [
    {
      name: 'description',
      content: 'Cari dan download foto race Anda dengan mudah menggunakan nomor bib'
    }
  ]
})

// State
const events = ref<Event[]>([])
const isLoading = ref(true)

// Check authentication (optional - for showing different UI)
const { fetchUser, isAuthenticated } = useUser()

// Fetch events
const fetchEvents = async () => {
  isLoading.value = true
  try {
    const data = await $fetch<Event[]>('/api/events')
    events.value = data.sort((a, b) => {
      // Sort by date descending (newest first)
      if (a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
      return 0
    })
  } catch (error) {
    console.error('Failed to fetch events:', error)
    events.value = []
  } finally {
    isLoading.value = false
  }
}

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

// Select event and navigate to event page
const selectEvent = (event: Event) => {
  navigateTo(`/event/${event.id}`)
}

// On mounted
onMounted(async () => {
  await fetchUser()
  await fetchEvents()
})
</script>
