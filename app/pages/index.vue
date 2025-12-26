<template>
  <div>
    <!-- Hero Section -->
    <UPageHero
      title="Temukan Foto Race Anda"
      description="Cari dan download foto race Anda dengan mudah menggunakan nomor bib. Pilih event yang Anda ikuti dan temukan momen terbaik Anda!"
      :links="[
        { label: 'Mulai Cari Foto', color: 'primary', size: 'lg', to: '#events' }
      ]"
    >
      <template #headline>
        <UBadge variant="subtle" size="lg">
          <UIcon name="i-heroicons-camera" class="mr-1" />
          Platform Pencarian Foto Race
        </UBadge>
      </template>
    </UPageHero>

    <!-- Events Section -->
    <UContainer>
      <div id="events" class="py-16">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold mb-4">Pilih Event Anda</h2>
          <p class="text-lg text-gray-500 dark:text-gray-400">Temukan event race yang pernah Anda ikuti dan cari foto Anda</p>
        </div>
        
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="text-4xl text-primary animate-spin mb-4" />
        <p class="text-muted">Memuat daftar event...</p>
      </div>

      <!-- Events Carousel -->
      <UCarousel
        v-else-if="events.length > 0"
        v-slot="{ item }"
        :items="events"
        :ui="{
          item: 'basis-full sm:basis-1/2 lg:basis-1/3',
          container: 'gap-4'
        }"
        class="overflow-hidden"
        arrows
      >
        <div 
          class="relative aspect-[4/3] overflow-hidden rounded-lg cursor-pointer group"
          @click="selectEvent(item)"
        >
          <!-- Background Image -->
          <img
            :src="getEventImage(item)"
            :alt="item.name"
            class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          
          <!-- Content Overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-6">
            <div class="text-white space-y-3">
              <h3 class="text-2xl font-bold group-hover:scale-105 transition-transform">
                {{ item.name }}
              </h3>
              <div class="space-y-2 text-white/90">
                <div v-if="item.date" class="flex items-center gap-2">
                  <UIcon name="i-heroicons-calendar" class="flex-shrink-0 w-5 h-5" />
                  <span class="text-base">{{ formatDate(item.date) }}</span>
                </div>
              </div>
              <UButton
                color="neutral"
                variant="outline"
                size="lg"
                block
                class="mt-4"
                @click.stop="selectEvent(item)"
              >
                <UIcon name="i-heroicons-magnifying-glass" />
                Cari Foto
              </UButton>
            </div>
          </div>
          
          <!-- Hover Effect -->
        </div>
      </UCarousel>

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
      </div>
    </UContainer>

    <!-- Features Section -->
    <UContainer>
      <div class="py-16">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold mb-4">Cara Menggunakan</h2>
          <p class="text-gray-500 dark:text-gray-400">Tiga langkah mudah untuk menemukan foto race Anda</p>
        </div>
        
        <UPageGrid>
          <UPageCard
            title="1. Pilih Event"
            description="Pilih event race yang Anda ikuti dari daftar yang tersedia"
            icon="i-heroicons-numbered-list"
          />
          <UPageCard
            title="2. Masukkan Bib"
            description="Input nomor bib yang Anda gunakan saat race"
            icon="i-heroicons-hashtag"
          />
          <UPageCard
            title="3. Download Foto"
            description="Temukan dan download foto terbaik Anda"
            icon="i-heroicons-arrow-down-tray"
          />
        </UPageGrid>
      </div>
    </UContainer>

    <!-- Photo Showcase Marquee -->
    <div class="py-16 overflow-hidden">
      <UMarquee :speed="40" class="mb-14">
        <div
          v-for="(photo, index) in showcasePhotos.slice(0, 5)"
          :key="index"
          class="relative w-90 h-60 overflow-hidden rounded-lg"
        >
          <img
            :src="photo.url"
            :alt="photo.alt"
            class="w-full h-full object-cover"
          />
        </div>
      </UMarquee>

      <UMarquee :speed="40" :reverse="true">
        <div
          v-for="(photo, index) in showcasePhotos.slice(5, 10)"
          :key="index"
          class="relative  w-90 h-60 overflow-hidden rounded-lg"
        >
          <img
            :src="photo.url"
            :alt="photo.alt"
            class="w-full h-full object-cover"
          />
        </div>
      </UMarquee>
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

// Showcase photos for marquee
const showcasePhotos = ref([
  {
    url: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&q=80',
    alt: 'Marathon Runner',
    event: 'Jakarta Marathon 2024',
    location: 'Jakarta'
  },
  {
    url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
    alt: 'Trail Runner',
    event: 'Bromo Trail Run',
    location: 'Bromo, Jawa Timur'
  },
  {
    url: 'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=800&q=80',
    alt: 'Finish Line',
    event: 'Bali Marathon',
    location: 'Bali'
  },
  {
    url: 'https://images.unsplash.com/photo-1532444458054-01a7dd3e9fca?w=800&q=80',
    alt: 'Group Running',
    event: 'Color Run Indonesia',
    location: 'Bandung'
  },
  {
    url: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80',
    alt: 'Ultra Marathon',
    event: 'Ultra Trail Indonesia',
    location: 'Papua'
  },
  {
    url: 'https://images.unsplash.com/photo-1486218119243-13883505764c?w=800&q=80',
    alt: 'City Marathon',
    event: 'Surabaya Marathon',
    location: 'Surabaya'
  },
  {
    url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80',
    alt: 'Mountain Trail',
    event: 'Rinjani Trail Challenge',
    location: 'Lombok'
  },
  {
    url: 'https://images.unsplash.com/photo-1461897104016-0b3b00cc81ee?w=800&q=80',
    alt: 'Night Run',
    event: 'Electric Run Jakarta',
    location: 'Jakarta'
  },
  {
    url: 'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=800&q=80',
    alt: 'Beach Run',
    event: 'Bali Beach Run',
    location: 'Bali'
  },
  {
    url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80',
    alt: 'City Run',
    event: 'Yogyakarta Half Marathon',
    location: 'Yogyakarta'
  }
])

// Sample event images
const eventImages = [
  'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&q=80', // Marathon
  'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80', // Trail running
  'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=800&q=80', // Finish line
  'https://images.unsplash.com/photo-1532444458054-01a7dd3e9fca?w=800&q=80', // Group running
  'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80', // Ultra marathon
]

// Get event image (cycle through sample images)
const getEventImage = (event: Event) => {
  const index = events.value.indexOf(event) % eventImages.length
  return eventImages[index]
}

// Check authentication
const { isAuthenticated } = useUser()

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
  await fetchEvents()
})
</script>