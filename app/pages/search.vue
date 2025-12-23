<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="bg-primary shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center gap-4">
          <UButton
            color="primary"
            variant="ghost"
            icon="i-heroicons-arrow-left"
            to="/"
            size="lg"
          />
          <div class="flex-1">
            <h1 class="text-2xl font-bold text-white">{{ eventName || 'Racetify Photos' }}</h1>
            <p class="text-sm text-gray-200 mt-1">Cari foto race Anda dengan bib number</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Search Form -->
      <UCard class="mb-8">
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-magnifying-glass" class="text-2xl text-primary" />
            <div>
              <h2 class="text-xl font-semibold text-highlighted">Cari Foto Anda</h2>
              <p class="text-sm text-muted">Masukkan nomor bib Anda untuk menemukan foto</p>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Bib Number Input -->
          <div>
            <label class="block text-sm font-medium text-highlighted mb-2">
              Nomor Bib
            </label>
            <div class="flex gap-2">
              <UInput
                v-model="bibNumber"
                type="text"
                placeholder="Contoh: 1234"
                size="xl"
                class="flex-1"
                :disabled="isSearching"
                @keyup.enter="searchPhotos"
              />
              <UButton
                color="primary"
                size="xl"
                :loading="isSearching"
                :disabled="!bibNumber || isSearching"
                @click="searchPhotos"
              >
                <UIcon name="i-heroicons-magnifying-glass" class="text-lg" />
                Cari
              </UButton>
            </div>
          </div>

          <!-- Event Info -->
          <div v-if="eventName" class="bg-primary/5 rounded-lg p-4 flex items-center gap-3">
            <UIcon name="i-heroicons-flag" class="text-2xl text-primary" />
            <div>
              <p class="text-sm text-muted">Event yang dipilih:</p>
              <p class="font-semibold text-highlighted">{{ eventName }}</p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Loading State -->
      <div v-if="isSearching" class="text-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="text-4xl text-primary animate-spin mb-4" />
        <p class="text-muted">Mencari foto Anda...</p>
      </div>

      <!-- Results -->
      <div v-else-if="searchPerformed">
        <!-- No Results -->
        <UCard v-if="photos.length === 0" class="text-center py-12">
          <UIcon name="i-heroicons-photo" class="text-6xl text-muted mb-4 mx-auto" />
          <h3 class="text-xl font-medium text-highlighted mb-2">
            Tidak Ada Foto Ditemukan
          </h3>
          <p class="text-muted mb-4">
            Tidak ada foto dengan nomor bib "{{ bibNumber }}" di event {{ eventName }}
          </p>
          <p class="text-sm text-muted">
            Pastikan nomor bib Anda benar atau coba lagi nanti jika foto masih dalam proses.
          </p>
        </UCard>

        <!-- Photo Grid -->
        <div v-else>
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-highlighted">
              Ditemukan {{ photos.length }} foto untuk bib #{{ bibNumber }}
            </h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <UCard
              v-for="photo in photos"
              :key="photo.id"
              class="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <!-- Photo Image -->
              <div class="aspect-w-16 aspect-h-9 bg-gray-100 relative">
                <img
                  :src="photo.public_url"
                  :alt="`Photo ${photo.id}`"
                  class="w-full h-64 object-cover cursor-pointer"
                  @click="openPhotoModal(photo)"
                />
                <div class="absolute top-2 right-2 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                  #{{ bibNumber }}
                </div>
              </div>

              <!-- Photo Details -->
              <template #footer>
                <div class="space-y-2">
                  <div v-if="photo.event" class="flex items-center gap-2 text-sm">
                    <UIcon name="i-heroicons-calendar" class="text-muted" />
                    <span class="text-highlighted font-medium">{{ photo.event.name }}</span>
                  </div>
                  <div v-if="photo.location" class="flex items-center gap-2 text-sm">
                    <UIcon name="i-heroicons-map-pin" class="text-muted" />
                    <span class="text-muted">{{ photo.location.name }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-sm">
                    <UIcon name="i-heroicons-clock" class="text-muted" />
                    <span class="text-muted">{{ formatDate(photo.created_at) }}</span>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex gap-2 mt-4">
                    <UButton
                      color="primary"
                      block
                      @click="downloadPhoto(photo)"
                    >
                      <UIcon name="i-heroicons-arrow-down-tray" />
                      Download
                    </UButton>
                    <UButton
                      color="neutral"
                      variant="outline"
                      @click="openPhotoModal(photo)"
                    >
                      <UIcon name="i-heroicons-eye" />
                    </UButton>
                  </div>
                </div>
              </template>
            </UCard>
          </div>
        </div>
      </div>

      <!-- Initial State -->
      <UCard v-else class="text-center py-12">
        <UIcon name="i-heroicons-photo" class="text-6xl text-primary mb-4 mx-auto" />
        <h3 class="text-xl font-medium text-highlighted mb-2">
          Temukan Foto Race Anda
        </h3>
        <p class="text-muted">
          Masukkan nomor bib Anda di atas untuk mencari foto
        </p>
      </UCard>
    </div>

    <!-- Photo Modal -->
    <UModal v-model="isModalOpen">
      <UCard v-if="selectedPhoto" :ui="{ body: { padding: 'p-0' }, header: { padding: 'p-4' }, footer: { padding: 'p-4' } }">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-highlighted">
                Foto #{{ bibNumber }}
              </h3>
              <p v-if="selectedPhoto.event" class="text-sm text-muted">
                {{ selectedPhoto.event.name }}
              </p>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="isModalOpen = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <img
            :src="selectedPhoto.public_url"
            :alt="`Photo ${selectedPhoto.id}`"
            class="w-full h-auto rounded-lg"
          />

          <div class="grid grid-cols-2 gap-4 text-sm">
            <div v-if="selectedPhoto.event">
              <span class="text-muted">Event:</span>
              <span class="text-highlighted font-medium ml-2">{{ selectedPhoto.event.name }}</span>
            </div>
            <div v-if="selectedPhoto.location">
              <span class="text-muted">Lokasi:</span>
              <span class="text-highlighted font-medium ml-2">{{ selectedPhoto.location.name }}</span>
            </div>
            <div>
              <span class="text-muted">Tanggal:</span>
              <span class="text-highlighted font-medium ml-2">{{ formatDate(selectedPhoto.created_at) }}</span>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex gap-2">
            <UButton
              color="primary"
              block
              @click="downloadPhoto(selectedPhoto)"
            >
              <UIcon name="i-heroicons-arrow-down-tray" />
              Download Foto
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Event, PhotoWithBibs } from '~/types'

// Meta tags - Public page, no auth required
definePageMeta({
  layout: false // Use default layout without auth
})

useHead({
  title: 'Cari Foto - Racetify Photos',
  meta: [
    {
      name: 'description',
      content: 'Cari dan download foto race Anda menggunakan nomor bib'
    }
  ]
})

// Get route params
const route = useRoute()
const eventId = computed(() => route.query.eventId as string)
const eventName = computed(() => route.query.eventName as string)

// State
const bibNumber = ref('')
const photos = ref<PhotoWithBibs[]>([])
const isSearching = ref(false)
const searchPerformed = ref(false)
const isModalOpen = ref(false)
const selectedPhoto = ref<PhotoWithBibs | null>(null)

// Redirect to home if no event selected
if (!eventId.value) {
  navigateTo('/')
}

// Search photos by bib number
const searchPhotos = async () => {
  if (!bibNumber.value.trim()) {
    return
  }

  if (!eventId.value) {
    navigateTo('/')
    return
  }

  isSearching.value = true
  searchPerformed.value = true

  try {
    const params: any = {
      bib: bibNumber.value.trim(),
      eventId: eventId.value
    }

    const data = await $fetch<PhotoWithBibs[]>('/api/photos/search-by-bib', {
      params
    })

    photos.value = data
  } catch (error: any) {
    console.error('Search failed:', error)
    photos.value = []
    
    // Show error notification
    const notification = useNotification()
    notification.error('Error', error.data?.message || 'Gagal mencari foto. Silakan coba lagi.')
  } finally {
    isSearching.value = false
  }
}

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Open photo in modal
const openPhotoModal = (photo: PhotoWithBibs) => {
  selectedPhoto.value = photo
  isModalOpen.value = true
}

// Download photo
const downloadPhoto = async (photo: PhotoWithBibs) => {
  try {
    // Create a temporary link and trigger download
    const link = document.createElement('a')
    link.href = photo.public_url!
    link.download = `racetify-photo-${bibNumber.value}-${photo.id}.jpg`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    const notification = useNotification()
    notification.success('Download dimulai!')
  } catch (error) {
    console.error('Download failed:', error)
    const notification = useNotification()
    notification.error('Error', 'Gagal download foto')
  }
}

// Auto-focus on bib input
onMounted(() => {
  // Focus will happen naturally, no need for explicit focus
})
</script>
