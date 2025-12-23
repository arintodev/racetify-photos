<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="bg-primary shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center gap-4">
          <UButton
            color="white"
            variant="ghost"
            icon="i-heroicons-arrow-left"
            to="/upload"
            size="lg"
          />
          <div class="flex-1">
            <h1 class="text-2xl font-bold text-white">{{ event?.name || 'Loading...' }}</h1>
            <div class="flex items-center gap-4 mt-1 text-sm text-gray-200">
              <span v-if="event?.date" class="flex items-center gap-1">
                <UIcon name="i-heroicons-calendar" />
                {{ formatDate(event.date) }}
              </span>
              <span v-if="event?.location" class="flex items-center gap-1">
                <UIcon name="i-heroicons-map-pin" />
                {{ event.location }}
              </span>
            </div>
          </div>
          <div class="flex gap-2">
            <UButton
              color="white"
              variant="solid"
              :to="`/gallery/${eventId}`"
            >
              <UIcon name="i-heroicons-photo" />
              Gallery
            </UButton>
            <UButton
              color="white"
              variant="outline"
              @click="handleLogout"
            >
              <UIcon name="i-heroicons-arrow-right-on-rectangle" />
              Logout
            </UButton>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading Event -->
    <div v-if="isLoadingEvent" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <UIcon name="i-heroicons-arrow-path" class="text-4xl text-primary animate-spin mb-4" />
      <p class="text-muted">Memuat event...</p>
    </div>

    <!-- Event Not Found -->
    <div v-else-if="!event" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <UCard class="text-center py-12">
        <UIcon name="i-heroicons-exclamation-triangle" class="text-6xl text-red-500 mb-4 mx-auto" />
        <h3 class="text-xl font-medium text-highlighted mb-2">
          Event Tidak Ditemukan
        </h3>
        <p class="text-muted mb-6">
          Event yang Anda cari tidak tersedia
        </p>
        <UButton color="primary" to="/upload">
          <UIcon name="i-heroicons-arrow-left" />
          Kembali ke Daftar Event
        </UButton>
      </UCard>
    </div>

    <!-- Main Content -->
    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Location Selection (Optional) -->
      <UCard class="mb-6">
        <template #header>
          <h2 class="text-lg font-semibold text-highlighted">Lokasi Foto (Opsional)</h2>
        </template>

        <div v-if="loadingLocations" class="text-center py-4">
          <UIcon name="i-heroicons-arrow-path" class="text-2xl text-primary animate-spin" />
        </div>

        <div v-else-if="locations.length > 0">
          <USelectMenu
            v-model="selectedLocation"
            :options="[{ id: null, name: 'Tanpa Lokasi Spesifik' }, ...locations]"
            option-attribute="name"
            placeholder="Pilih lokasi foto (opsional)"
            size="lg"
          >
            <template #label>
              <UIcon name="i-heroicons-map-pin" class="mr-2" />
              {{ selectedLocation?.name || 'Tanpa Lokasi Spesifik' }}
            </template>
          </USelectMenu>
          <p class="text-sm text-muted mt-2">
            Pilih lokasi di mana foto diambil (misal: Start Line, Finish Line, KM 5, dll)
          </p>
        </div>

        <div v-else class="text-sm text-muted">
          Tidak ada lokasi yang tersedia untuk event ini
        </div>
      </UCard>

      <!-- Upload Section -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-highlighted">Upload Foto</h2>
            <div class="flex gap-2">
              <UButton
                v-if="uploadStats.error > 0"
                color="red"
                variant="outline"
                size="sm"
                @click="handleRetry"
                :disabled="isUploading"
              >
                <UIcon name="i-heroicons-arrow-path" />
                Retry Failed ({{ uploadStats.error }})
              </UButton>
              <UButton
                v-if="uploadStats.total > 0"
                color="gray"
                variant="outline"
                size="sm"
                @click="handleClear"
                :disabled="isUploading"
              >
                <UIcon name="i-heroicons-trash" />
                Clear
              </UButton>
            </div>
          </div>
        </template>

        <!-- Dropzone -->
        <div
          class="border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer"
          :class="[
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400'
          ]"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <UIcon
            name="i-heroicons-photo"
            class="text-6xl mx-auto mb-4"
            :class="isDragging ? 'text-primary' : 'text-muted'"
          />
          <p class="text-lg font-medium text-highlighted mb-2">
            Drag & drop foto di sini
          </p>
          <p class="text-sm text-muted mb-4">
            atau klik untuk memilih file
          </p>
          <UButton
            color="primary"
            size="lg"
            :disabled="isUploading"
          >
            <UIcon name="i-heroicons-folder-open" class="mr-2" />
            Pilih Foto
          </UButton>
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          />
          <p class="text-xs text-muted mt-4">
            Mendukung JPG, PNG, WEBP. Max 10MB per file.
          </p>
        </div>

        <!-- Upload Stats -->
        <div v-if="uploadStats.total > 0" class="mt-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-gray-50 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-highlighted">
                {{ uploadStats.total }}
              </div>
              <div class="text-sm text-muted mt-1">Total</div>
            </div>
            <div class="bg-green-50 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-green-600">
                {{ uploadStats.success }}
              </div>
              <div class="text-sm text-green-600 mt-1">Success</div>
            </div>
            <div class="bg-blue-50 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-blue-600">
                {{ uploadStats.uploading }}
              </div>
              <div class="text-sm text-blue-600 mt-1">Uploading</div>
            </div>
            <div class="bg-red-50 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-red-600">
                {{ uploadStats.error }}
              </div>
              <div class="text-sm text-red-600 mt-1">Failed</div>
            </div>
          </div>

          <!-- Upload List -->
          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="[key, progress] in Array.from(uploadQueue)"
              :key="key"
              class="bg-gray-50 rounded-lg p-3 border border-gray-200"
            >
              <div class="flex items-center gap-3">
                <!-- Status Icon -->
                <UIcon
                  v-if="progress.status === 'success'"
                  name="i-heroicons-check-circle"
                  class="text-2xl text-green-500 flex-shrink-0"
                />
                <UIcon
                  v-else-if="progress.status === 'error'"
                  name="i-heroicons-x-circle"
                  class="text-2xl text-red-500 flex-shrink-0"
                />
                <UIcon
                  v-else-if="progress.status === 'uploading' || progress.status === 'compressing'"
                  name="i-heroicons-arrow-path"
                  class="text-2xl text-blue-500 flex-shrink-0 animate-spin"
                />
                <UIcon
                  v-else
                  name="i-heroicons-clock"
                  class="text-2xl text-gray-400 flex-shrink-0"
                />

                <!-- File Info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-highlighted truncate">
                    {{ progress.file.name }}
                  </p>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs text-muted">
                      {{ formatFileSize(progress.file.size) }}
                    </span>
                    <span class="text-xs font-medium" :class="getStatusColor(progress.status)">
                      {{ getStatusText(progress.status) }}
                    </span>
                  </div>
                  
                  <!-- Progress Bar -->
                  <div v-if="progress.status === 'uploading' || progress.status === 'compressing'" class="mt-2">
                    <div class="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        class="bg-blue-500 h-1.5 rounded-full transition-all"
                        :style="{ width: `${progress.progress}%` }"
                      ></div>
                    </div>
                  </div>

                  <!-- Error Message -->
                  <p v-if="progress.error" class="text-xs text-red-600 mt-1">
                    {{ progress.error }}
                  </p>
                </div>

                <!-- Retry Button -->
                <UButton
                  v-if="progress.status === 'error'"
                  color="red"
                  variant="outline"
                  size="xs"
                  @click="handleRetryFile(key)"
                >
                  <UIcon name="i-heroicons-arrow-path" />
                  Retry
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Tips -->
      <UCard class="mt-6">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-light-bulb" class="text-xl text-primary" />
            <h3 class="font-semibold text-highlighted">Tips</h3>
          </div>
        </template>
        <ul class="space-y-2 text-sm text-muted">
          <li class="flex items-start gap-2">
            <UIcon name="i-heroicons-check" class="text-green-500 flex-shrink-0 mt-0.5" />
            <span>Foto akan otomatis dikompres untuk mempercepat upload</span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon name="i-heroicons-check" class="text-green-500 flex-shrink-0 mt-0.5" />
            <span>Anda bisa upload beberapa foto sekaligus</span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon name="i-heroicons-check" class="text-green-500 flex-shrink-0 mt-0.5" />
            <span>Jangan tutup halaman ini saat proses upload sedang berjalan</span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon name="i-heroicons-check" class="text-green-500 flex-shrink-0 mt-0.5" />
            <span>Foto yang gagal bisa di-retry dengan klik tombol "Retry"</span>
          </li>
        </ul>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Event, PhotoLocation } from '~/types'

// Meta tags
definePageMeta({
  middleware: 'auth'
})

// Get route params
const route = useRoute()
const eventId = route.params.eventId as string

// Dynamic meta
const event = ref<Event | null>(null)

useHead(() => ({
  title: event.value ? `Upload ke ${event.value.name}` : 'Upload - Racetify Photos'
}))

// Composables
const { user, fetchUser } = useUser()
const { auth } = useSupabase()
const { 
  uploadQueue, 
  isUploading, 
  uploadPhotosWithConcurrency,
  uploadStats,
  clearQueue,
  retryFailed
} = usePhotoUpload()

// State
const locations = ref<PhotoLocation[]>([])
const selectedLocation = ref<PhotoLocation | null>(null)
const isLoadingEvent = ref(true)
const loadingLocations = ref(false)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()

// Fetch event details
const fetchEvent = async () => {
  isLoadingEvent.value = true
  try {
    const data = await $fetch<Event>(`/api/events/${eventId}`)
    event.value = data
  } catch (error) {
    console.error('Failed to fetch event:', error)
    event.value = null
  } finally {
    isLoadingEvent.value = false
  }
}

// Fetch locations
const fetchLocations = async () => {
  loadingLocations.value = true
  try {
    const { data: { session } } = await auth.getSession()
    if (!session) throw new Error('No session')

    const data = await $fetch<PhotoLocation[]>(`/api/events/${eventId}/locations`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })
    locations.value = data
  } catch (error) {
    console.error('Failed to fetch locations:', error)
    locations.value = []
  } finally {
    loadingLocations.value = false
  }
}

// Check if there are active uploads
const hasActiveUploads = computed(() => {
  const queue = Array.from(uploadQueue.value.values())
  return queue.some(item => 
    item.status === 'uploading' || 
    item.status === 'compressing' || 
    item.status === 'idle'
  )
})

// Handle beforeunload event
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (hasActiveUploads.value) {
    e.preventDefault()
    e.returnValue = ''
    return ''
  }
}

// Handle drop
const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  
  const files = Array.from(event.dataTransfer?.files || [])
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length > 0 && user.value) {
    startUpload(imageFiles)
  }
}

// Trigger file input
const triggerFileInput = () => {
  fileInput.value?.click()
}

// Handle file select
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

// Start upload
const startUpload = async (files: File[]) => {
  if (!user.value) return

  try {
    await uploadPhotosWithConcurrency(
      files,
      eventId,
      user.value.id,
      3,
      selectedLocation.value?.id
    )
  } catch (error) {
    console.error('Upload failed:', error)
  }
}

// Handle retry
const handleRetry = async () => {
  if (!user.value) return
  await retryFailed(eventId, user.value.id, selectedLocation.value?.id)
}

// Handle retry single file
const handleRetryFile = async (fileKey: string) => {
  if (!user.value) return
  
  const progress = uploadQueue.value.get(fileKey)
  if (!progress || progress.status !== 'error') return
  
  await uploadPhotosWithConcurrency(
    [progress.file],
    eventId,
    user.value.id,
    1,
    selectedLocation.value?.id
  )
}

// Clear queue
const handleClear = () => {
  if (confirm('Hapus semua item dari daftar?')) {
    clearQueue()
  }
}

// Handle logout
const handleLogout = async () => {
  try {
    await auth.signOut()
    navigateTo('/login')
  } catch (error) {
    console.error('Logout error:', error)
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

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'success': return 'text-green-600'
    case 'error': return 'text-red-600'
    case 'uploading':
    case 'compressing': return 'text-blue-600'
    default: return 'text-gray-500'
  }
}

// Get status text
const getStatusText = (status: string) => {
  switch (status) {
    case 'idle': return 'Menunggu'
    case 'compressing': return 'Kompres...'
    case 'uploading': return 'Upload...'
    case 'success': return 'Berhasil'
    case 'error': return 'Gagal'
    default: return status
  }
}

// Navigation guard
onBeforeRouteLeave((to, from, next) => {
  if (hasActiveUploads.value) {
    const answer = window.confirm(
      'Masih ada foto yang sedang diupload. Yakin ingin meninggalkan halaman ini?'
    )
    if (answer) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})

// On mounted
onMounted(async () => {
  await fetchUser()
  await fetchEvent()
  await fetchLocations()
  
  window.addEventListener('beforeunload', handleBeforeUnload)
})

// On unmounted
onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>
