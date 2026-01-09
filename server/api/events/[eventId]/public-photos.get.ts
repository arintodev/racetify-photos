import { serverSupabaseClient } from '#supabase/server'

/**
 * API endpoint untuk fetch photos berdasarkan event_id
 * Dengan optional filter location_id via query params
 * 
 * Query params:
 * - location_id (optional): filter by location
 * - limit (optional): number of photos to return (default: 1000)
 * - offset (optional): number of photos to skip (default: 0)
 * 
 * Response:
 * - Array of Photo objects with event and location details
 */
export default defineEventHandler(async (event) => {
  try {
    const supabase: any = await serverSupabaseClient(event)

    const eventId = getRouterParam(event, 'eventId')
    const query = getQuery(event)
    const locationId = query.location_id as string | undefined
    const limit = parseInt(query.limit as string) || 20
    const offset = parseInt(query.offset as string) || 0

    if (!eventId) {
      throw createError({
        statusCode: 400,
        message: 'Event ID is required'
      })
    }

    // Build query
    let queryBuilder = supabase
      .from('photos')
      .select(`
        id,
        photographer_id,
        location_id,
        original_name,
        photo_path,
        height,
        width
      `)
      .or("ocr_result.is.null,ocr_result.eq.")
      .eq('status', 'completed')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by location if provided
    if (locationId) {
      queryBuilder = queryBuilder.eq('location_id', locationId)
    }

    const { data, error } = await queryBuilder

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message
      })
    }

    // Transform response with public URLs
    const photos = (data || []).map((item: any) => {
      const { data: publicUrlData } = supabase.storage
        .from('event-photos')
        .getPublicUrl(item.photo_path)

      return {
        ...item,
        public_url: publicUrlData.publicUrl,
        event_name: item.events?.name,
        location_name: item.photo_locations?.name
      }
    })

    return photos

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch photos'
    })
  }
})
