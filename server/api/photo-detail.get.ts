import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const photoId = query.photo_id as string

  if (!photoId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Photo ID is required'
    })
  }

  const supabase: any = await serverSupabaseClient(event)

  try {
    // Get photo detail with location info
    const { data: photo, error } = await supabase
      .from('photos')
      .select(`
        id,
        original_name,
        cam_make,
        cam_model,
        aperture,
        exposure_time,
        focal_length,
        iso,
        height,
        width,
        original_time,
        created_at,
        photo_locations (
          name
        )
      `)
      .eq('id', photoId)
      .single()

    if (error) {
      console.error('Error fetching photo detail:', error)
      throw createError({
        statusCode: 404,
        statusMessage: 'Photo not found'
      })
    }

    return {
      success: true,
      data: photo
    }
  } catch (error: any) {
    console.error('Error in photo detail endpoint:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch photo detail'
    })
  }
})