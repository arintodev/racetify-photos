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
          class="gallery-item"
          :class="{
            'gallery-item-selectable': selectable,
            'gallery-item-selected': selectedItems.has(item.id),
            'gallery-item-activable': activable
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
            v-if="imageLoadingStates.get(item.id) !== false"
            class="photo-placeholder"
          >
            <div class="skeleton-loader">
              <div class="skeleton-shimmer"></div>
            </div>
            <div class="loading-indicator">
              <svg class="loading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
            </div>
          </div>

          <!-- Image -->
          <img
            :src="item.thumbnailUrl || item.imageUrl"
            :alt="item.alt || item.title || `Photo ${item.id}`"
            class="gallery-image"
            :class="{
              'cursor-pointer': activable || selectable,
              'loaded': imageLoadingStates.get(item.id) === false
            }"
            loading="lazy"
            @load="handleImageLoad(item.id)"
            @error="handleImageError"
          />

          <!-- Selection Checkbox -->
          <div
            v-if="selectable"
            class="selection-checkbox"
            @click.stop="toggleSelection(item)"
          >
            <div class="checkbox" :class="{ 'checked': selectedItems.has(item.id) }">
              <svg v-if="selectedItems.has(item.id)" class="checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            </div>
          </div>

          <!-- Labels -->
          <div
            v-if="showLabels !== 'never' && item.title"
            class="gallery-label"
            :class="{
              'opacity-0 group-hover:opacity-100': showLabels === 'hover',
              'opacity-100': showLabels === 'always'
            }"
          >
            <p class="text-sm text-white font-medium truncate">{{ item.title }}</p>
          </div>

          <!-- Hover Overlay -->
          <div
            v-if="activable"
            class="gallery-overlay opacity-0 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <Teleport to="body" v-if="lightboxOpen">
      <div
        class="lightbox-overlay"
        @click="closeLightbox"
        @keydown.escape="closeLightbox"
        tabindex="-1"
      >
        <div class="lightbox-content" @click.stop>
          <!-- Close Button -->
           
          <!-- Zoom Controls -->
          <div class="lightbox-zoom-controls">
            <button
              class="zoom-btn"
              @click.stop="closeLightbox"
              aria-label="Close"
            >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <button
              class="zoom-btn"
              @click.stop="zoomIn"
              :disabled="zoomLevel >= 3"
              aria-label="Zoom in"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21l-4.35-4.35M11 8v6m-3-3h6"/></g></svg>
            </button>
            <button
              class="zoom-btn"
              @click.stop="zoomOut"
              :disabled="zoomLevel <= 0.5"
              aria-label="Zoom out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21l-4.35-4.35M8 11h6"/></g></svg>
            </button>
            <button
              class="zoom-btn"
              @click.stop="resetZoom"
              :disabled="zoomLevel === 1 && panX === 0 && panY === 0"
              aria-label="Reset zoom"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 15l6 6M15 9l6-6m0 13v5h-5m5-13V3h-5M3 16v5h5m-5 0l6-6M3 8V3h5m1 6L3 3"/></svg>
            </button>
          </div>
          
          <!-- Image -->
          <img
            v-if="currentLightboxItem"
            :src="currentLightboxItem.imageUrl"
            :alt="currentLightboxItem.alt || currentLightboxItem.title || `Photo ${currentLightboxItem.id}`"
            class="lightbox-image"
            :class="{ 'draggable': zoomLevel > 1 }"
            :style="{
              transform: `scale(${zoomLevel}) translate(${panX / zoomLevel}px, ${panY / zoomLevel}px)`,
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
          />

          <!-- Navigation -->
          <button
            v-if="items.length > 1"
            class="lightbox-nav lightbox-prev"
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
            class="lightbox-nav lightbox-next"
            @click.stop="nextImage"
            :disabled="currentLightboxIndex === items.length - 1"
            aria-label="Next image"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <!-- Zoom Level Indicator -->
          <div class="zoom-indicator" v-if="zoomLevel !== 1">
            {{ Math.round(zoomLevel * 100) }}%
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import justifiedLayout from 'justified-layout'

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

interface JustifiedItem extends GalleryItem {
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
  items: GalleryItem[]
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
  activable: true,
  selectable: false,
  forceAspectRatio: false,
  showWidows: true,
  fullWidthBreakoutRowCadence: false,
})

/* ================= EMITS ================= */

const emit = defineEmits<{
  'item-click': [item: GalleryItem]
  'select': [items: GalleryItem[]]
  'lightbox-open': [item: GalleryItem]
  'lightbox-close': []
}>()

/* ================= STATE ================= */

const galleryRef = ref<HTMLElement | null>(null)
const containerWidth = ref(1200)
const selectedItems = ref(new Set<string | number>())
const lightboxOpen = ref(false)
const currentLightboxIndex = ref(0)
const layoutGeometry = ref<LayoutGeometry>({ containerHeight: 0, boxes: [] })
const layoutItems = ref<JustifiedItem[]>([])
const imageLoadingStates = ref(new Map<string | number, boolean>())

// Zoom state
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const isDragging = ref(false)
const lastMouseX = ref(0)
const lastMouseY = ref(0)

/* ================= COMPUTED ================= */

const galleryStyle = computed(() => ({
  gap: `${props.gap}px`,
}))

const currentLightboxItem = computed(() => {
  return props.items[currentLightboxIndex.value] || null
})

/* ================= JUSTIFIED LAYOUT LOGIC ================= */

const getImageDimensions = (item: GalleryItem): { aspectRatio: number } => {
  // Use existing dimensions if available
  if (item.width && item.height) {
    return { aspectRatio: item.width / item.height }
  }

  return { aspectRatio: 1.5 }
}

const calculateJustifiedLayout = (items: GalleryItem[]) => {
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
    if (!imageLoadingStates.value.has(item.id)) {
      imageLoadingStates.value.set(item.id, true)
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
    calculateJustifiedLayout(props.items)
  }
}

let resizeObserver: ResizeObserver | null = null

/* ================= EVENT HANDLERS ================= */

const handleItemClick = (item: GalleryItem) => {
  if (props.lightbox) {
    openLightbox(item)
  } else {
    emit('item-click', item)
  }
}

const handleImageLoad = (itemId: string | number) => {
  imageLoadingStates.value.set(itemId, false)
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const toggleSelection = (item: GalleryItem) => {
  if (!props.selectable) return
  
  const newSelection = new Set(selectedItems.value)
  
  if (newSelection.has(item.id)) {
    newSelection.delete(item.id)
  } else {
    newSelection.add(item.id)
  }
  
  selectedItems.value = newSelection
  
  const selected = props.items.filter(i => newSelection.has(i.id))
  emit('select', selected)
}

/* ================= LIGHTBOX ================= */

const openLightbox = (item: GalleryItem) => {
  const index = props.items.findIndex(i => i.id === item.id)
  if (index !== -1) {
    currentLightboxIndex.value = index
    lightboxOpen.value = true
    resetZoom()
    emit('lightbox-open', item)
    document.body.style.overflow = 'hidden'
  }
}

const closeLightbox = () => {
  lightboxOpen.value = false
  resetZoom()
  emit('lightbox-close')
  document.body.style.overflow = ''
  document.body.style.touchAction = ''
}

const previousImage = () => {
  if (currentLightboxIndex.value > 0) {
    currentLightboxIndex.value--
    resetZoom()
  }
}

const nextImage = () => {
  if (currentLightboxIndex.value < props.items.length - 1) {
    currentLightboxIndex.value++
    resetZoom()
  }
}

// Zoom functions
const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.5, 5)
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
  }
}

const endDrag = () => {
  isDragging.value = false
  document.body.style.cursor = ''
}

// Touch handlers for mobile
const startTouch = (event: TouchEvent) => {
  if (event.touches.length === 1) {
    event.preventDefault()
    event.stopPropagation()
    
    if (zoomLevel.value > 1) {
      isDragging.value = true
      const touch = event.touches[0]
      if (touch) {
        lastMouseX.value = touch.clientX
        lastMouseY.value = touch.clientY
      }
    }
    
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
  }
}

const touchMove = (event: TouchEvent) => {
  if (event.touches.length === 1) {
    event.preventDefault()
    event.stopPropagation()
    
    const touch = event.touches[0]
    if (isDragging.value && zoomLevel.value > 1 && touch) {
      const deltaX = touch.clientX - lastMouseX.value
      const deltaY = touch.clientY - lastMouseY.value
      panX.value += deltaX
      panY.value += deltaY
      lastMouseX.value = touch.clientX
      lastMouseY.value = touch.clientY
    }
  }
}

const endTouch = (event: TouchEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = false
  document.body.style.touchAction = ''
}

/* ================= WATCHERS ================= */

watch(
  () => props.items,
  (newItems) => {
    calculateJustifiedLayout(newItems)
  },
  { deep: true }
)

watch(
  () => [props.targetRowHeight, props.gap, props.targetRowHeightTolerance, props.maxNumRows],
  () => {
    calculateJustifiedLayout(props.items)
  }
)

// Watch for container width changes
watch(
  containerWidth,
  (newWidth, oldWidth) => {
    if (props.items.length > 0 && Math.abs(newWidth - oldWidth) > 10) {
      calculateJustifiedLayout(props.items)
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
  refresh: () => calculateJustifiedLayout(props.items),
  selectAll: () => {
    if (props.selectable) {
      selectedItems.value = new Set(props.items.map(item => item.id))
      emit('select', props.items)
    }
  },
  unselectAll: () => {
    if (props.selectable) {
      selectedItems.value.clear()
      emit('select', [])
    }
  },
  getSelected: () => props.items.filter(item => selectedItems.value.has(item.id)),
})
</script>

<style scoped>
.justified-gallery-wrapper {
  position: relative;
}

.gallery-container {
  width: 100%;
}

.gallery-row {
  display: flex;
  align-items: flex-start;
}

.gallery-item {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  background-color: #f3f4f6;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  group: true;
}

.photo-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.skeleton-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #e5e7eb;
}

.skeleton-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.6),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

.loading-indicator {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.loading-icon {
  width: 2rem;
  height: 2rem;
  opacity: 0.6;
  animation: fade 1.5s ease-in-out infinite alternate;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes fade {
  0% {
    opacity: 0.4;
  }
  100% {
    opacity: 0.8;
  }
}

.gallery-item-activable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  z-index: 1;
}

.gallery-item-selectable {
  cursor: pointer;
}

.gallery-item-selected {
  ring: 2px;
  ring-color: rgb(59, 130, 246);
  ring-offset: 2px;
}

.gallery-image {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease, opacity 0.3s ease;
  z-index: 2;
  opacity: 0;
}

.gallery-image.loaded {
  opacity: 1;
}

.gallery-item:hover .gallery-image {
  transform: scale(1.02);
}

.selection-checkbox {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
}

.checkbox {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.checkbox.checked {
  background-color: rgb(59, 130, 246);
  border-color: rgb(59, 130, 246);
}

.checkmark {
  width: 12px;
  height: 12px;
  color: white;
}

.gallery-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 20px 12px 12px;
  transition: opacity 0.3s ease;
}

.gallery-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

/* Lightbox Styles */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.lightbox-content {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.lightbox-image {
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 40px);
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease;
  user-select: none;
}

.lightbox-image.draggable {
  transition: none;
}

.lightbox-zoom-controls {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1001;
}

.zoom-btn {
  background-color: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.zoom-btn:hover:not(:disabled) {
  background-color: rgba(0, 0, 0, 0.7);
  transform: scale(1.05);
}

.zoom-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.zoom-indicator {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  z-index: 1001;
}

.lightbox-nav {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.lightbox-nav:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-50%) scale(1.1);
}

.lightbox-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.lightbox-prev {
  left: 10px;
}

.lightbox-next {
  right: 10px;
}

/* Responsive */
@media (max-width: 768px) {
  .gallery-item {
    border-radius: 2px;
  }
  
  .loading-icon {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  .lightbox-zoom-controls {
    top: 20px;
    right: 10px;
    gap: 6px;
  }
  
  .zoom-btn {
    width: 35px;
    height: 35px;
  }
  
  .lightbox-nav {
    width: 40px;
    height: 40px;
  }
  
  .lightbox-prev {
    left: -50px;
  }
  
  .lightbox-next {
    right: -50px;
  }
}

@media (max-width: 480px) {
  .loading-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .lightbox-content {
    padding: 10px;
  }
  
  .lightbox-image {
    max-width: calc(100vw - 20px);
    max-height: calc(100vh - 20px);
  }
  
  .lightbox-zoom-controls {
    position: fixed;
    top: 20px;
    right: 20px;
    gap: 8px;
    z-index: 1002;
  }
  
  .zoom-btn {
    width: 32px;
    height: 32px;
  }
  
  .zoom-btn svg {
    width: 16px;
    height: 16px;
  }
  
  .lightbox-nav {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
  }
  
  .lightbox-prev {
    left: 10px;
  }
  
  .lightbox-next {
    right: 10px;
  }
  
  .zoom-indicator {
    bottom: 80px;
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style>