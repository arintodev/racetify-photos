<template>
  <div class="natural-gallery-wrapper w-full">
    <div
      ref="galleryRef"
      class="natural-gallery-container w-full"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Natural } from '@ecodev/natural-gallery-js'
import '@ecodev/natural-gallery-js/natural-gallery.css'

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

interface Props {
  items: GalleryItem[]
  loading?: boolean
  emptyMessage?: string
  rowHeight?: number
  gap?: number
  showLabels?: 'hover' | 'always' | 'never'
  lightbox?: boolean
  activable?: boolean
  selectable?: boolean
}

/* ================= PROPS ================= */

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyMessage: 'No images to display',
  rowHeight: 400,
  gap: 8,
  showLabels: 'never',
  lightbox: false,
  activable: true,
  selectable: false,
})

/* ================= EMITS ================= */

const emit = defineEmits<{
  'item-click': [item: GalleryItem]
  'pagination': [data: { offset: number; limit: number }]
  'select': [items: GalleryItem[]]
}>()

/* ================= STATE ================= */

const galleryRef = ref<HTMLElement | null>(null)
let gallery: Natural | null = null
let isUpdating = false
let previousItemsLength = 0

/* ================= INIT ================= */

const initGallery = async () => {
  if (!galleryRef.value || gallery) return

  await nextTick()

  gallery = new Natural(galleryRef.value, {
    rowHeight: props.rowHeight,
    gap: props.gap,
    lightbox: props.lightbox,
    activable: props.activable,
    selectable: props.selectable,
    minRowsAtStart: 0,
    rowsPerPage: 0,
  })

  bindEvents()
  updateGallery(props.items)
}

/* ================= EVENTS ================= */

const bindEvents = () => {
  if (!galleryRef.value) return

  galleryRef.value.addEventListener('activate', (e: any) => {
    const id = e.detail?.item?.model?.id
    const item = props.items.find(i => String(i.id) === String(id))
    if (item) emit('item-click', item)
  })

  galleryRef.value.addEventListener('pagination', (e: any) => {
    if (props.loading || isUpdating) {
      return
    }
    emit('pagination', e.detail)
  })

  if (props.selectable) {
    galleryRef.value.addEventListener('select', (e: any) => {
      const selected = e.detail
        .map((i: any) =>
          props.items.find(p => String(p.id) === String(i.model.id)),
        )
        .filter(Boolean)

      emit('select', selected)
    })
  }
}

/* ================= ITEMS ================= */

const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      resolve({ width: 1920, height: 1080 })
    }
    img.src = url
  })
}

const updateGallery = async (items: GalleryItem[]) => {
  if (!gallery) return

  isUpdating = true

  if (!items.length) {
    gallery.setItems([])
    previousItemsLength = 0
    isUpdating = false
    return
  }

  // Detect if this is append or reset
  const isAppend = items.length > previousItemsLength && previousItemsLength > 0
  const itemsToProcess = isAppend ? items.slice(previousItemsLength) : items

  const galleryItems = await Promise.all(
    itemsToProcess.map(async (item) => {
      let width = item.width
      let height = item.height

      if (!width || !height) {
        const dimensions = await getImageDimensions(item.thumbnailUrl || item.imageUrl)
        width = dimensions.width
        height = dimensions.height
      }

      return {
        id: String(item.id),
        thumbnailSrc: item.thumbnailUrl || item.imageUrl,
        enlargedSrc: item.imageUrl,
        enlargedWidth: width,
        enlargedHeight: height,
        title: item.title || item.alt || '',
      }
    })
  )

  if (isAppend) {
    // Use addItems for appending new photos
    gallery.addItems(galleryItems)
  } else {
    // Use setItems for initial load or reset
    gallery.setItems(galleryItems)
  }

  previousItemsLength = items.length
  
  // Wait a bit before allowing pagination again
  setTimeout(() => {
    isUpdating = false
  }, 300)
}

/* ================= DESTROY ================= */

const destroyGallery = () => {
  if (!gallery) return
  gallery.clear()
  gallery = null
  previousItemsLength = 0
  isUpdating = false
}

/* ================= WATCHERS ================= */

watch(
  () => props.items,
  items => {
    if (gallery) {
      updateGallery(items)
    }
  },
  { deep: true },
)

watch(
  () => props.loading,
  loading => {
    if (!loading && !gallery) {
      initGallery()
    }
  },
)

/* ================= LIFECYCLE ================= */

onMounted(() => {
  if (!props.loading) {
    initGallery()
  }
})

onUnmounted(() => {
  destroyGallery()
})

/* ================= EXPOSE ================= */

defineExpose({
  refresh() {
    destroyGallery()
    nextTick(initGallery)
  },
  clear: destroyGallery,
  selectAll: () => gallery?.selectDomCollection(),
  unselectAll: () => gallery?.unselectAllItems(),
})
</script>