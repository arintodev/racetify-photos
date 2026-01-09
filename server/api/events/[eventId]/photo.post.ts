import { serverSupabaseClient } from '#supabase/server'
import sizeOf from 'image-size'
import type { PhotoMeta, UploadResponse } from '../../../../app/types'
import { v4 as uuidv4 } from 'uuid';

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
    let meta: PhotoMeta | undefined = undefined

    for (const part of formData) {
      if (part.name === 'file') {
        fileData = part.data
        fileName = part.filename
      } else if (part.name === 'fileName') {
        fileName = part.data.toString()
      } else if (part.name === 'locationId') {
        locationId = part.data.toString()
      } else if (part.name === 'meta') {
        try {
          meta = JSON.parse(part.data.toString())
        } catch (e) {
          meta = undefined
        }
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

    // Generate unique filename dengan UUID
    const ext = fileName.split('.').pop()
    const uniqueFileName = `${uuidv4()}.${ext}`

    // Construct storage path
    const photoPath = `${eventId}/${photographerId}/${uniqueFileName}`

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
      original_name: meta?.original_name,
      original_time: meta?.original_time,
      cam_make: meta?.cam_make,
      cam_model: meta?.cam_model,
      lens_model: meta?.lens_model,
      iso: meta?.iso,
      aperture: meta?.aperture,
      exposure_time: meta?.exposure_time,
      focal_length: meta?.focal_length
    }
    // Add locationId if provided (optional)
    if (locationId) {
      jobData.location_id = locationId
    }
    
    const { data, error: jobError } = await supabase
      .from('photos')
      .insert(jobData)
      .select(`
        id,
        photographer_id,
        location_id,
        original_name,
        photo_path,
        height,
        width
      `)
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)
      // Photo uploaded but job creation failed - log but don't fail request
    }
  
    return {
      success: true,
      data
    }

  } catch (error: any) {
    console.error('Upload photo error:', error)
    
    return {
      success: false,
      error: error.message || 'Failed to upload photo'
    }
  }
})
