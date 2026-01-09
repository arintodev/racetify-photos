import imageCompression from 'browser-image-compression'
import type { PhotoMeta, UploadProgress } from '~/types'

/**
 * Composable untuk handle photo upload dengan kompresi
 * Menggunakan browser-image-compression untuk kompresi client-side
 * dan API routes untuk upload ke Supabase
 */
export const usePhotoUpload = (onUploaded: any) => {
  const { authFetch } = useAuthFetch()
  
  // State untuk tracking upload progress
  const uploadQueue = ref<Map<string, UploadProgress>>(new Map())
  const isUploading = ref(false)
  const uploadCounter = ref(0) //   Counter untuk unique keys

  /**
   * Kompresi foto di browser
   */
  const compressPhoto = async (file: File): Promise<File> => {
    const options = {
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.90
    }

    try {
      const compressedFile = await imageCompression(file, options)
      return compressedFile
    } catch (error) {
      console.error('Compression error:', error)
      throw new Error('Failed to compress image')
    }
  }

  /**
   * Upload single foto ke server
   */
  const uploadSinglePhoto = async (
    eventId: string,
    locationId: string | undefined | null,
    file: {file: File, meta: PhotoMeta},
    fileKey: string,
  ): Promise<void> => {
    try {
      // Update status: compressing
      uploadQueue.value.set(fileKey, {
        file,
        status: 'compressing',
        progress: 0
      })

      // Kompresi foto
      const compressedFile = await compressPhoto(file.file)

      // Update status: uploading
      uploadQueue.value.set(fileKey, {
        file,
        status: 'uploading',
        progress: 30
      })

      // Prepare form data
      const formData = new FormData()
      formData.append('file', compressedFile, file.file.name)

      if (locationId) {
        formData.append('locationId', locationId)
      }
      if (file.meta) {
        formData.append('meta', JSON.stringify(file.meta))
      }

      // Upload ke API
      const uploadResponse = await authFetch<{ success: boolean; data?: any; error?: string }>(
        `/api/events/${eventId}/photo`,
        {
          method: 'POST',
          body: formData
        }
      )

      if (!uploadResponse.success || !uploadResponse?.data.photo_path) {
        throw new Error(uploadResponse.error || 'Upload failed')
      }

      // Update status: success (job automatically created)
      uploadQueue.value.set(fileKey, {
        file,
        status: 'success',
        progress: 100,
      })

      if (onUploaded) {
        onUploaded(uploadResponse.data)
      }

    } catch (error: any) {
      console.error('Upload error:', error)
      
      // Update status: error
      uploadQueue.value.set(fileKey, {
        file,
        status: 'error',
        progress: 0,
        error: error.message || 'Upload failed'
      })

      throw error
    }
  }

  /**
   * Upload multiple photos (batch)
   */
  const uploadPhotos = async (
    eventId: string,
    locationId: string | undefined | null,
    files: Array<{ file: File, meta: any }>,
  ): Promise<void> => {
    const wasUploading = isUploading.value
    isUploading.value = true

    try {
      // Add files to queue with unique keys (TIDAK clear queue)
      const fileKeys: string[] = []
      files.forEach((file) => {
        uploadCounter.value++
        const key = `${file.file.name}-${uploadCounter.value}-${Date.now()}`
        fileKeys.push(key)
        uploadQueue.value.set(key, {
          file,
          status: 'idle',
          progress: 0
        })
      })

      // Upload files sequentially (untuk menghindari overload)
      // Bisa diganti dengan Promise.all untuk parallel upload
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileKey = fileKeys[i]

        if (!file || !fileKey) {
          continue
        }
        
        try {
          await uploadSinglePhoto(eventId, locationId, file, fileKey)
        } catch (error) {
          // Continue dengan file berikutnya meskipun ada error
          console.error(`Failed to upload ${file?.file.name}:`, error)
        }
      }

    } finally {
      // Only set to false if it wasn't uploading before
      if (!wasUploading) {
        isUploading.value = false
      }
    }
  }

  /**
   * Get upload statistics
   */
  const uploadStats = computed(() => {
    const queue = Array.from(uploadQueue.value.values())
    return {
      total: queue.length,
      success: queue.filter(q => q.status === 'success').length,
      error: queue.filter(q => q.status === 'error').length,
      uploading: queue.filter(q => q.status === 'uploading' || q.status === 'compressing').length,
      idle: queue.filter(q => q.status === 'idle').length
    }
  })

  /**
   * Clear upload queue
   */
  const clearQueue = () => {
    uploadQueue.value.clear()
  }

  /**
   * Retry failed uploads
   */
  const retryFailed = async (eventId: string, locationId?: string) => {
    const failedItems = Array.from(uploadQueue.value.entries())
      .filter(([_, progress]) => progress.status === 'error')

    for (const [key, progress] of failedItems) {
      try {
        await uploadSinglePhoto(eventId, locationId, progress.file, key)
      } catch (error) {
        console.error(`Retry failed for ${progress.file.file.name}:`, error)
      }
    }
  }

  return {
    uploadQueue,
    isUploading,
    uploadPhotos,
    uploadStats,
    clearQueue,
    retryFailed
  }
}
