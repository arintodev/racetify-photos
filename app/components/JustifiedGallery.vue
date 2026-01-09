<template>
  <div class="justified-gallery-wrapper w-full">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center min-h-64">
      <div class="flex flex-col items-center space-y-4">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        <p class="text-gray-600">Loading photos...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!items.length" class="flex justify-center items-center min-h-64">
      <div class="text-center text-gray-500">
        <svg class="mx-auto h-16 w-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>{{ emptyMessage }}</p>
      </div>
    </div>
    
    <!-- Gallery -->
    <div v-else class="justified-gallery" :style="galleryStyle" ref="galleryRef">
      <div
        class="gallery-container"
        :style="{ 
          position: 'relative',
          height: `${layoutGeometry.containerHeight}px`
        }"
      >
        <div
          v-for="(item, index) in layoutItems"
          :key="item.id"
          class="relative overflow-hidden rounded bg-gray-100 transition-all duration-200 ease-in-out"
          :class="{
            'cursor-pointer': selectable,
            'ring-2 ring-blue-500 scale-95': selectedItems.has(item.id),
            'hover:-translate-y-0.5 hover:shadow-lg hover:z-10': activable
          }"
          :style="{
            position: 'absolute',
            left: `${item.left}px`,
            top: `${item.top}px`,
            width: `${item.width}px`,
            height: `${item.height}px`
          }"
          @click="handleItemClick(item)"
        >
          <!-- Loading Placeholder -->
          <div 
            v-if="imageStates.get(item.id) === 0"
            class="absolute inset-0 bg-gray-100 flex items-center justify-center z-10"
          >
            <div class="absolute inset-0 overflow-hidden bg-gray-200">
              <div class="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            </div>
            <div class="relative z-20 flex items-center justify-center text-gray-400">
              <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary-500" />
            </div>
          </div>

          <!-- Image -->
          <img
            :src="item.thumbnail_url || item.photo_url"
            :alt="item.original_name || item.id"
            class="relative w-full h-full object-cover block transition-all duration-300 ease-in-out z-20 opacity-0"
            :class="{
              'cursor-pointer': activable || selectable,
              'opacity-100': imageStates.get(item.id) === 1,
              'hover:scale-105': activable
            }"
            loading="lazy"
            @load="handleImageLoad(item.id)"
            @error="(event) => handleImageError(event, item.id)"
          />

          <!-- Selection Checkbox -->
          <div
            v-if="selectable"
            class="absolute top-2 right-2 z-20"
            @click.stop="toggleSelection(item)"
          >
            <div class="w-5 h-5 rounded-full border-2 bg-black/30 flex items-center justify-center transition-all duration-200" :class="selectedItems.has(item.id) ? 'bg-blue-500 border-blue-500' : 'border-white/80'">
              <svg v-if="selectedItems.has(item.id)" class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            </div>
          </div>

          <!-- Labels -->
          <div
            v-if="showLabels !== 'never' && item.original_name"
            class="gallery-label"
            :class="{
              'opacity-0 group-hover:opacity-100': showLabels === 'hover',
              'opacity-100': showLabels === 'always'
            }"
          >
            <p class="text-sm text-white font-medium truncate">{{ item.original_name }}</p>
          </div>

          <!-- Hover Overlay -->
          <div
            v-if="activable"
            class="absolute inset-0 bg-black/10 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <Teleport to="body" v-if="lightboxOpen">
      <div
        class="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] backdrop-blur-sm"
        @click="closeLightbox"
        @keydown.escape="closeLightbox"
        tabindex="-1"
      >
        
        <div class="relative flex items-center justify-center p-5 sm:p-2.5 box-border" @click.stop>
          <!-- Close Button -->
           
          <!-- Zoom Controls -->
          <div class="fixed top-4 right-4 flex flex-col gap-2 z-[110]" v-if="currentLightboxItem">
            <UButton
              @click.stop="closeLightbox"
              class="rounded-full text-white backdrop-blur-md bg-gray/10 border-none hover:bg-gray/20 disabled:bg-gray/5 disabled:opacity-50"
              aria-label="Close"
              icon="lucide-x"
            />
            <UButton
              @click.stop="zoomIn"
              :disabled="zoomLevel >= 3"
              class="rounded-full text-white backdrop-blur-md bg-gray/10 border-none hover:bg-gray/20 disabled:bg-gray/5 disabled:opacity-50"
              aria-label="Zoom in"
              icon="lucide-zoom-in"
            />
            <UButton
              @click.stop="zoomOut"
              :disabled="zoomLevel <= 0.5"
              class="rounded-full text-white backdrop-blur-md bg-gray/10 border-none hover:bg-gray/20 disabled:bg-gray/5 disabled:opacity-50"
              aria-label="Zoom out"
              icon="lucide-zoom-out"
            />
            <UButton
              class="rounded-full text-white backdrop-blur-md bg-gray/10 border-none hover:bg-gray/20 disabled:bg-gray/5 disabled:opacity-50"
              @click.stop="resetZoom"
              :disabled="zoomLevel === 1 && panX === 0 && panY === 0"
              aria-label="Reset zoom"
              icon="lucide-expand"
            />

            <UButton
              class="rounded-full text-white backdrop-blur-md bg-gray/10 border-none hover:bg-gray/20 disabled:bg-gray/5 disabled:opacity-50"
              @click.stop="downloadImage(currentLightboxItem)"
              aria-label="Download"
              :disabled="lightboxImageState !== 1"
              icon="lucide-download"
            />
            <UButton
              class="rounded-full text-white backdrop-blur-md bg-gray/10 border-none hover:bg-gray/20 disabled:bg-gray/5 disabled:opacity-50"
              @click.stop="toggleInfoPanel"
              aria-label="Photo info"
              icon="lucide-info"
            />
          </div>
          
          <!-- Image -->
          <div v-if="currentLightboxItem" class="relative flex items-center justify-center">           
            <!-- Loading spinner -->
            <div v-if="lightboxImageState === 0" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120]">
              <div class="flex items-center justify-center bg-black/50 rounded-full p-3 backdrop-blur-md">
                <div class="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
              </div>
            </div>
            <!-- Full resolution image -->
            <img
              :src="currentLightboxItem.photo_url"
              :alt="currentLightboxItem.original_name || currentLightboxItem.id"
              class="lightbox-image max-w-[calc(100vw-2.5rem)] max-h-[calc(100vh-2.5rem)] w-auto h-auto object-contain rounded-lg shadow-2xl transition-all duration-300 ease-in-out select-none absolute top-1/2 left-1/2 origin-center"
              :class="{ 
                'transition-none': zoomLevel > 1
              }"
              :style="{
                transform: `translate(-50%, -50%) scale(${zoomLevel}) translate(${panX / zoomLevel}px, ${panY / zoomLevel}px)`,
                cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }"
              @dragstart.prevent
              @wheel.stop="handleWheel"
              @mousedown.stop="startDrag"
              @mousemove.stop="drag"
              @mouseup.stop="endDrag"
              @mouseleave.stop="endDrag"
              @touchstart.stop="startTouch"
              @touchmove.stop="touchMove"
              @touchend.stop="endTouch"
              @load="handleLightboxImageLoad"
              @error="handleLightboxImageError"
            />
          </div>

          <!-- Navigation -->
          <button
            v-if="items.length > 1"
            class="fixed top-1/2 -translate-y-1/2 left-2.5 bg-gray/10 border-none rounded-full w-12 h-12 sm:w-11 sm:h-11 md:w-10 md:h-10 flex items-center justify-center text-white cursor-pointer transition-all duration-200 backdrop-blur-md hover:bg-gray/20 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed z-[110]"
            @click.stop="previousImage"
            :disabled="currentLightboxIndex === 0"
            aria-label="Previous image"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            v-if="items.length > 1"
            class="fixed top-1/2 -translate-y-1/2 right-2.5 bg-gray/10 border-none rounded-full w-12 h-12 sm:w-11 sm:h-11 md:w-10 md:h-10 flex items-center justify-center text-white cursor-pointer transition-all duration-200 backdrop-blur-md hover:bg-gray/20 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed z-[110]"
            @click.stop="nextImage"
            :disabled="currentLightboxIndex === items.length - 1"
            aria-label="Next image"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <!-- Zoom Level Indicator -->
          <div class="fixed bottom-5 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md z-[110]" v-if="zoomLevel !== 1">
            {{ Math.round(zoomLevel * 100) }}%
          </div>
        </div>
      </div>
    </Teleport>
    
    <!-- Photo Detail Modal -->
    <PhotoDetailModal
      :visible="showPhotoDetailModal"
      :photo-id="currentLightboxItem?.id"
      @close="showPhotoDetailModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import justifiedLayout from 'justified-layout'
import type { Photo } from '~/types'

const { photoUrl } = useSupabase()

/* ================= TYPES ================= */

export interface GalleryItem {
  id: string | number
  imageUrl: string
  thumbnailUrl?: string
  title?: string
  alt?: string
  width?: number
  height?: number
  [key: string]: any
}

interface EnhancedPhoto extends Photo {
  photo_url?: string
  thumbnail_url?: string
}

interface JustifiedItem extends EnhancedPhoto {
  width: number
  height: number
  left: number
  top: number
  aspectRatio: number
}

interface LayoutGeometry {
  containerHeight: number
  boxes: Array<{
    left: number
    top: number
    width: number
    height: number
  }>
}

interface Props {
  items: Photo[]
  loading?: boolean
  emptyMessage?: string
  targetRowHeight?: number
  targetRowHeightTolerance?: number
  maxNumRows?: number
  gap?: number
  showLabels?: 'hover' | 'always' | 'never'
  lightbox?: boolean
  activable?: boolean
  selectable?: boolean
  forceAspectRatio?: number | boolean
  showWidows?: boolean
  fullWidthBreakoutRowCadence?: number | boolean
}

/* ================= PROPS ================= */

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyMessage: 'No images to display',
  targetRowHeight: 280,
  targetRowHeightTolerance: 0.25,
  maxNumRows: Number.POSITIVE_INFINITY,
  gap: 10,
  showLabels: 'never',
  lightbox: false,
  activable: false,
  selectable: false,
  forceAspectRatio: false,
  showWidows: true,
  fullWidthBreakoutRowCadence: false
})

// URL cache untuk performance optimization
const urlCache = new Map<string, { photo_url: string; thumbnail_url: string }>()

// Transform items prop ke computed GalleryItems dengan cache
const galleryItems = computed<EnhancedPhoto[]>(() => {
  return props.items.map(photo => {
    // Get or create cached URLs
    let urls = urlCache.get(photo.photo_path)
    if (!urls) {
      urls = {
        photo_url: photoUrl(photo.photo_path, { transform: { quality: 100}}),
        thumbnail_url: photoUrl(photo.photo_path, { transform: { height: 300, quality: 80 }})
      }
      urlCache.set(photo.photo_path, urls)
    }
    
    return {
      ...photo,
      ...urls
    }
  })
})

async function downloadImage(item: EnhancedPhoto) {
  const url =  photoUrl(item.photo_path)
  
  const a = document.createElement('a')
  if (item.original_name) {
    a.href = `${url}?download=${encodeURIComponent(item.original_name)}`
  } else {
    a.href = url
  }
  a.click()

  URL.revokeObjectURL(url)
}

/* ================= EMITS ================= */

const emit = defineEmits<{
  'item-click': [item: Photo]
  'select': [items: Photo[]]
  'lightbox-open': [item: Photo]
  'lightbox-close': []
}>()

/* ================= STATE ================= */

const galleryRef = ref<HTMLElement | null>(null)
const containerWidth = ref(1200)
const selectedItems = ref(new Set<string | number>())
const lightboxOpen = ref(false)
const currentLightboxIndex = ref(0)
const lightboxImageState = ref<number>(0)
const layoutGeometry = ref<LayoutGeometry>({ containerHeight: 0, boxes: [] })
const layoutItems = ref<JustifiedItem[]>([])
const imageStates = ref(new Map<string | number, number>())

// Zoom state
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const isDragging = ref(false)
const lastMouseX = ref(0)
const lastMouseY = ref(0)
const showInfoPanel = ref(false)
const showPhotoDetailModal = ref(false)
const currentPhotoId = ref<string | null>(null)

// Touch/pinch zoom state
const initialPinchDistance = ref(0)
const initialZoomLevel = ref(1)

// Double tap state
const lastTapTime = ref(0)
const tapTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
const DOUBLE_TAP_DELAY = 300
const tapStartPos = ref({ x: 0, y: 0 })
const TAP_THRESHOLD = 10 // pixels

/* ================= COMPUTED ================= */

const galleryStyle = computed(() => ({
  gap: `${props.gap}px`,
}))

const currentLightboxItem = computed(() => {
  return galleryItems.value[currentLightboxIndex.value] || null
})

/* ================= JUSTIFIED LAYOUT LOGIC ================= */

const getImageDimensions = (item: Photo): { aspectRatio: number } => {
  // Use existing dimensions if available
  if (item.width && item.height) {
    return { aspectRatio: item.width / item.height }
  }
  return { aspectRatio: 1.5 }
}

const calculateJustifiedLayout = (items: Photo[]) => {
  if (!items.length) {
    layoutGeometry.value = { containerHeight: 0, boxes: [] }
    layoutItems.value = []
    return
  }

  // Get aspect ratios for all items (synchronously from data)
  const itemsWithAspectRatio = items.map(item => {
    const { aspectRatio } = getImageDimensions(item)
    return aspectRatio
  })

  // Configure justified-layout options
  const layoutOptions = {
    containerWidth: containerWidth.value,
    containerPadding: 0,
    boxSpacing: props.gap,
    targetRowHeight: props.targetRowHeight,
    targetRowHeightTolerance: props.targetRowHeightTolerance,
    maxNumRows: props.maxNumRows,
    forceAspectRatio: props.forceAspectRatio,
    showWidows: props.showWidows,
    fullWidthBreakoutRowCadence: props.fullWidthBreakoutRowCadence,
  }

  // Calculate layout using justified-layout library
  const geometry = justifiedLayout(itemsWithAspectRatio, layoutOptions)
  
  layoutGeometry.value = {
    containerHeight: geometry.containerHeight,
    boxes: geometry.boxes,
  }

  // Map items to layout positions
  layoutItems.value = items.map((item, index) => ({
    ...item,
    width: geometry.boxes[index]?.width || 0,
    height: geometry.boxes[index]?.height || 0,
    left: geometry.boxes[index]?.left || 0,
    top: geometry.boxes[index]?.top || 0,
    aspectRatio: itemsWithAspectRatio[index] || 1.5,
  }))

  // Initialize loading states for new items
  items.forEach(item => {
    if (!imageStates.value.has(item.id)) {
      imageStates.value.set(item.id, 0)
    }
  })
}

/* ================= RESIZE HANDLING ================= */

let resizeTimeout: ReturnType<typeof setTimeout> | null = null

const debouncedUpdateLayout = () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  
  resizeTimeout = setTimeout(() => {
    updateContainerWidth()
  }, 300) // 300ms debounce
}

const updateContainerWidth = async () => {
  await nextTick()
  
  if (!galleryRef.value) {
    return
  }
  
  const newWidth = galleryRef.value.offsetWidth || 1200
  
  // Only update if width actually changed significantly
  if (Math.abs(newWidth - containerWidth.value) > 10) {
    containerWidth.value = newWidth
    calculateJustifiedLayout(galleryItems.value)
  }
}

let resizeObserver: ResizeObserver | null = null

/* ================= EVENT HANDLERS ================= */

const handleItemClick = (item: Photo) => {
  if (props.lightbox) {
    openLightbox(item)
  } else {
    emit('item-click', item)
  }
}

const handleImageLoad = (itemId: string | number) => {
  imageStates.value.set(itemId, 1)
}

const handleImageError = (event: Event, itemId: string | number) => {
  imageStates.value.set(itemId, 2)
  const imgElement = event.target as HTMLImageElement
  imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E'
}

const toggleSelection = (item: Photo) => {
  if (!props.selectable) return
  
  const newSelection = new Set(selectedItems.value)
  
  if (newSelection.has(item.id)) {
    newSelection.delete(item.id)
  } else {
    newSelection.add(item.id)
  }
  
  selectedItems.value = newSelection
  
  const selected = galleryItems.value.filter(i => newSelection.has(i.id))
  emit('select', selected)
}

/* ================= LIGHTBOX ================= */

const openLightbox = (item: Photo) => {
  const index = galleryItems.value.findIndex(i => i.id === item.id)
  if (index !== -1) {
    currentLightboxIndex.value = index
    lightboxOpen.value = true
    lightboxImageState.value = 0
    resetZoom()
    emit('lightbox-open', item)
    document.body.style.overflow = 'hidden'
  }
}

const closeLightbox = () => {
  lightboxOpen.value = false
  showInfoPanel.value = false
  showPhotoDetailModal.value = false
  resetZoom()
  emit('lightbox-close')
  document.body.style.overflow = ''
  document.body.style.touchAction = ''
}

const toggleInfoPanel = () => {
  if (currentLightboxItem.value) {
    currentPhotoId.value = currentLightboxItem.value.id
    showPhotoDetailModal.value = true
  }
}

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

const previousImage = () => {
  if (currentLightboxIndex.value > 0) {
    currentLightboxIndex.value--
    lightboxImageState.value = 0
    showInfoPanel.value = false
    showPhotoDetailModal.value = false
    resetZoom()
  }
}

const nextImage = () => {
  if (currentLightboxIndex.value < galleryItems.value.length - 1) {
    currentLightboxIndex.value++
    lightboxImageState.value = 0
    showInfoPanel.value = false
    showPhotoDetailModal.value = false
    resetZoom()
  }
}

// Zoom functions
const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.5, 5)
  applyPanBoundaries()
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.5, 0.5)
}

const resetZoom = () => {
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  if (event.deltaY < 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

const startDrag = (event: MouseEvent) => {
  if (zoomLevel.value > 1) {
    isDragging.value = true
    lastMouseX.value = event.clientX
    lastMouseY.value = event.clientY
    document.body.style.cursor = 'grabbing'
  }
}

const drag = (event: MouseEvent) => {
  if (isDragging.value && zoomLevel.value > 1) {
    const deltaX = event.clientX - lastMouseX.value
    const deltaY = event.clientY - lastMouseY.value
    panX.value += deltaX
    panY.value += deltaY
    lastMouseX.value = event.clientX
    lastMouseY.value = event.clientY
    
    // Apply pan boundaries
    applyPanBoundaries()
  }
}

const endDrag = () => {
  isDragging.value = false
  document.body.style.cursor = ''
}

// Helper function to calculate distance between two touch points
const getDistance = (touch1: Touch, touch2: Touch) => {
  const dx = touch2.clientX - touch1.clientX
  const dy = touch2.clientY - touch1.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

// Helper function to zoom to specific coordinates
const zoomToPoint = (clientX: number, clientY: number, targetZoom: number = 2) => {
  const rect = document.querySelector('.lightbox-image')?.getBoundingClientRect()
  if (!rect) return
  
  // Calculate position relative to image center
  const imageCenterX = rect.left + rect.width / 2
  const imageCenterY = rect.top + rect.height / 2
  
  // Calculate offset from center
  const offsetX = (clientX - imageCenterX) * (targetZoom - zoomLevel.value)
  const offsetY = (clientY - imageCenterY) * (targetZoom - zoomLevel.value)
  
  // Update zoom and pan
  zoomLevel.value = targetZoom
  panX.value = panX.value - offsetX / targetZoom
  panY.value = panY.value - offsetY / targetZoom
  
  // Apply pan boundaries
  applyPanBoundaries()
}

// Helper function to constrain pan within image boundaries
const applyPanBoundaries = () => {
  const rect = document.querySelector('.lightbox-image')?.getBoundingClientRect()
  if (!rect || zoomLevel.value <= 1) {
    panX.value = 0
    panY.value = 0
    return
  }
  
  // Calculate actual image dimensions when zoomed
  const zoomedWidth = rect.width * zoomLevel.value
  const zoomedHeight = rect.height * zoomLevel.value
  
  // Calculate viewport dimensions
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // Calculate maximum pan distances
  const maxPanX = Math.max(0, (zoomedWidth - viewportWidth) / (2 * zoomLevel.value))
  const maxPanY = Math.max(0, (zoomedHeight - viewportHeight) / (2 * zoomLevel.value))
  
  // Constrain pan values
  panX.value = Math.max(-maxPanX, Math.min(maxPanX, panX.value))
  panY.value = Math.max(-maxPanY, Math.min(maxPanY, panY.value))
}

// Handle double tap detection with zoom in/out behavior
const handleSingleTap = (clientX: number, clientY: number) => {
  const currentTime = Date.now()
  const timeDiff = currentTime - lastTapTime.value

  if (timeDiff < DOUBLE_TAP_DELAY) {
    // Double tap detected
    if (tapTimeout.value) {
      clearTimeout(tapTimeout.value)
      tapTimeout.value = null
    }
    if (zoomLevel.value === 1) {
      // Zoom in to tapped area
      zoomToPoint(clientX, clientY, 2)
    } else {
      // Zoom out to normal when already zoomed
      resetZoom()
    }
    
    lastTapTime.value = 0
  } else {
    // Single tap - wait to see if there's a second tap
    lastTapTime.value = currentTime
    tapTimeout.value = setTimeout(() => {
      // Single tap confirmed - no action needed for lightbox
      lastTapTime.value = 0
      tapTimeout.value = null
    }, DOUBLE_TAP_DELAY)
  }
}

// Touch handlers for mobile - pinch zoom with 2 fingers, pan with 1 finger
const startTouch = (event: TouchEvent) => {
  if (event.touches.length === 2) {
    // 2-finger pinch zoom
    event.preventDefault()
    event.stopPropagation()
    
    const touch1 = event.touches[0]
    const touch2 = event.touches[1]
    
    if (touch1 && touch2) {
      // Store initial pinch distance and zoom level
      initialPinchDistance.value = getDistance(touch1, touch2)
      initialZoomLevel.value = zoomLevel.value
      
      // Store center point for panning
      lastMouseX.value = (touch1.clientX + touch2.clientX) / 2
      lastMouseY.value = (touch1.clientY + touch2.clientY) / 2
      
      isDragging.value = true
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    }
  } else if (event.touches.length === 1) {
    // Store initial touch position for tap detection
    const touch = event.touches[0]
    if (touch) {
      tapStartPos.value = { x: touch.clientX, y: touch.clientY }
      
      if (zoomLevel.value > 1) {
        // Prepare for potential pan when zoomed, but don't set isDragging yet
        event.preventDefault()
        event.stopPropagation()
        
        lastMouseX.value = touch.clientX
        lastMouseY.value = touch.clientY
        
        document.body.style.overflow = 'hidden'
        document.body.style.touchAction = 'none'
      }
    }
  }
}

const touchMove = (event: TouchEvent) => {
  if (event.touches.length === 2 && isDragging.value) {
    // 2-finger pinch zoom + pan
    event.preventDefault()
    event.stopPropagation()
    
    const touch1 = event.touches[0]
    const touch2 = event.touches[1]
    
    if (touch1 && touch2) {
      // Calculate current distance for pinch zoom
      const currentDistance = getDistance(touch1, touch2)
      const scaleRatio = currentDistance / initialPinchDistance.value
      const newZoomLevel = Math.max(0.5, Math.min(5, initialZoomLevel.value * scaleRatio))
      
      zoomLevel.value = newZoomLevel
      
      // Calculate center point for panning
      const centerX = (touch1.clientX + touch2.clientX) / 2
      const centerY = (touch1.clientY + touch2.clientY) / 2
      
      // Pan based on center point movement
      const deltaX = centerX - lastMouseX.value
      const deltaY = centerY - lastMouseY.value
      
      panX.value += deltaX
      panY.value += deltaY
      
      lastMouseX.value = centerX
      lastMouseY.value = centerY
      
      // Apply pan boundaries
      applyPanBoundaries()
    }
  } else if (event.touches.length === 1 && zoomLevel.value > 1) {
    // 1-finger pan when zoomed - only set isDragging when movement is detected
    event.preventDefault()
    event.stopPropagation()
    
    const touch = event.touches[0]
    if (touch) {
      const deltaX = Math.abs(touch.clientX - tapStartPos.value.x)
      const deltaY = Math.abs(touch.clientY - tapStartPos.value.y)
      
      // Only start dragging if there's significant movement
      if (deltaX > TAP_THRESHOLD || deltaY > TAP_THRESHOLD) {
        if (!isDragging.value) {
          isDragging.value = true
        }
        
        const moveDeltaX = touch.clientX - lastMouseX.value
        const moveDeltaY = touch.clientY - lastMouseY.value
        
        panX.value += moveDeltaX
        panY.value += moveDeltaY
        
        lastMouseX.value = touch.clientX
        lastMouseY.value = touch.clientY
        
        // Apply pan boundaries
        applyPanBoundaries()
      }
    }
  }
}

const endTouch = (event: TouchEvent) => {
  if (isDragging.value) {
    event.preventDefault()
    event.stopPropagation()
  }
  
  // Check for single tap (not drag) for double tap detection
  if (event.changedTouches.length === 1 && !isDragging.value) {
    const touch = event.changedTouches[0]
    if (touch) {
      const deltaX = Math.abs(touch.clientX - tapStartPos.value.x)
      const deltaY = Math.abs(touch.clientY - tapStartPos.value.y)
      
      // Only trigger tap if finger didn't move much (not a drag)
      if (deltaX < TAP_THRESHOLD && deltaY < TAP_THRESHOLD) {
        handleSingleTap(touch.clientX, touch.clientY)
      }
    }
  }
  
  isDragging.value = false
  initialPinchDistance.value = 0
  document.body.style.touchAction = ''
}


/* ================= LIGHTBOX IMAGE LOAD HANDLER ================= */
const handleLightboxImageLoad = () => {
  lightboxImageState.value = 1;
};

const handleLightboxImageError = () => {
  lightboxImageState.value = 2;
};

/* ================= WATCHERS ================= */

watch(
  () => galleryItems.value,
  (newItems) => {
    calculateJustifiedLayout(newItems)
  },
  { deep: true }
)

// Cleanup URL cache when items change to prevent memory leaks
watch(
  () => props.items,
  (newItems) => {
    const currentPaths = new Set(newItems.map(item => item.photo_path))
    for (const [path] of urlCache.entries()) {
      if (!currentPaths.has(path)) {
        urlCache.delete(path)
      }
    }
  },
  { deep: true }
)

watch(
  () => [props.targetRowHeight, props.gap, props.targetRowHeightTolerance, props.maxNumRows],
  () => {
    calculateJustifiedLayout(galleryItems.value)
  }
)

// Watch for container width changes
watch(
  containerWidth,
  (newWidth, oldWidth) => {
    if (galleryItems.value.length > 0 && Math.abs(newWidth - oldWidth) > 10) {
      calculateJustifiedLayout(galleryItems.value)
    }
  }
)

/* ================= LIFECYCLE ================= */

onMounted(async () => {  
  // Initial setup
  await updateContainerWidth()
  
  // Setup resize observer with fallback
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      debouncedUpdateLayout()
    })
    
    // Wait for ref to be available
    await nextTick()
    if (galleryRef.value) {
      resizeObserver.observe(galleryRef.value)
    } else {
      window.addEventListener('resize', debouncedUpdateLayout)
    }
  } else {
    window.addEventListener('resize', debouncedUpdateLayout)
  }
})

onUnmounted(() => {  
  // Clear resize timeout
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
    resizeTimeout = null
  }
  
  // Cleanup resize observer
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  } else {
    window.removeEventListener('resize', debouncedUpdateLayout)
  }
  
  document.body.style.overflow = ''
  
  // Cleanup double tap timeout
  if (tapTimeout.value) {
    clearTimeout(tapTimeout.value)
    tapTimeout.value = null
  }
  
  // Cleanup URL cache
  urlCache.clear()
})

/* ================= KEYBOARD EVENTS ================= */

const handleKeydown = (event: KeyboardEvent) => {
  if (!lightboxOpen.value) return
  
  switch (event.key) {
    case 'Escape':
      closeLightbox()
      break
    case 'ArrowLeft':
      previousImage()
      break
    case 'ArrowRight':
      nextImage()
      break
    case '+':
    case '=':
      event.preventDefault()
      zoomIn()
      break
    case '-':
    case '_':
      event.preventDefault()
      zoomOut()
      break
    case '0':
      event.preventDefault()
      resetZoom()
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

/* ================= EXPOSE ================= */

defineExpose({
  refresh: () => calculateJustifiedLayout(galleryItems.value),
  selectAll: () => {
    if (props.selectable) {
      selectedItems.value = new Set(galleryItems.value.map(item => item.id))
      emit('select', galleryItems.value)
    }
  },
  unselectAll: () => {
    if (props.selectable) {
      selectedItems.value.clear()
      emit('select', [])
    }
  },
  getSelected: () => galleryItems.value.filter(item => selectedItems.value.has(item.id)),
})
</script>

<style scoped>
@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* Custom animation for skeleton shimmer */
.animate-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  animation: shimmer 1.5s infinite;
}

/* Custom styles for lightbox image responsive sizing */
@media (max-width: 480px) {
  .lightbox-image {
    max-width: calc(100vw - 1.25rem);
    max-height: calc(100vh - 1.25rem);
  }
}
</style>