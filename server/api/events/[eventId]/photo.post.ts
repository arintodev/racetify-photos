import { serverSupabaseClient } from '#supabase/server'
import sizeOf from 'image-size'
import type { UploadResponse } from '~/types'

/**
 * API endpoint untuk upload foto ke Supabase Storage
 * 
 * Request body:
 * - file: File (multipart/form-data)
 * - photographerId: string
 * - fileName: string
 * - locationId: string (optional)
 * 
 * Response:
 * - success: boolean
 * - photoPath: string (jika sukses)
 * - error: string (jika gagal)
 */
export default defineEventHandler(async (event): Promise<UploadResponse> => {
  try {
    const supabase: any = await serverSupabaseClient(event)
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    // Get eventId from route params
    const eventId = getRouterParam(event, 'eventId')
    
    if (!eventId) {
      throw createError({
        statusCode: 400,
        message: 'Event ID is required'
      })
    }

    // Parse multipart form data
    const formData = await readMultipartFormData(event)
    
    if (!formData) {
      throw createError({
        statusCode: 400,
        message: 'No form data provided'
      })
    }

    // Extract data dari form
    let fileData: Buffer | undefined
    let fileName: string | undefined
    let locationId: string | undefined

    for (const part of formData) {
      if (part.name === 'file') {
        fileData = part.data
        fileName = part.filename
      } else if (part.name === 'fileName') {
        fileName = part.data.toString()
      } else if (part.name === 'locationId') {
        locationId = part.data.toString()
      }
    }

    // Validasi input
    if (!fileData || !fileName) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: file, fileName'
      })
    }

    // Use authenticated user ID as photographer ID
    const photographerId = user.id

    // Generate unique filename dengan timestamp
    const timestamp = Date.now()
    const ext = fileName.split('.').pop()
    const uniqueFileName = `${timestamp}_${fileName}`

    // Construct storage path
    const photoPath = `event_${eventId}/${photographerId}/${uniqueFileName}`

    // Upload ke Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('event-photos')
      .upload(photoPath, fileData, {
        contentType: 'image/jpeg',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw createError({
        statusCode: 500,
        message: `Failed to upload photo: ${uploadError.message}`
      })
    }
    // Get image dimensions
    const dimensions = sizeOf(fileData)

    // Create job entry in database
    const jobData: any = {
      event_id: eventId,
      photographer_id: photographerId,
      photo_path: uploadData.path,
      status: 'pending',
      width: dimensions.width || null,
      height: dimensions.height || null,
    }
    
    // Add locationId if provided (optional)
    if (locationId) {
      jobData.location_id = locationId
    }

    const { data: jobInsertData, error: jobError } = await supabase
      .from('photos')
      .insert(jobData)
      .select('id')
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)
      // Photo uploaded but job creation failed - log but don't fail request
    }

    return {
      success: true,
      photoPath: uploadData.path,
      jobId: jobInsertData?.id
    }

  } catch (error: any) {
    console.error('Upload photo error:', error)
    
    return {
      success: false,
      error: error.message || 'Failed to upload photo'
    }
  }
})
