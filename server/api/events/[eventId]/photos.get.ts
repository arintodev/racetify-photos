import { serverSupabaseClient } from '#supabase/server'

/**
 * API endpoint untuk fetch photos berdasarkan event_id
 * Dengan optional filter location_id via query params
 * 
 * Query params:
 * - location_id (optional): filter by location
 * 
 * Response:
 * - Array of Photo objects with event and location details
 */
export default defineEventHandler(async (event) => {
  try {
    const supabase: any = await serverSupabaseClient(event)
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const eventId = getRouterParam(event, 'eventId')
    const locationId = getQuery(event).location_id as string | undefined

    if (!eventId) {
      throw createError({
        statusCode: 400,
        message: 'Event ID is required'
      })
    }

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized: Invalid token'
      })
    }

    // Build query
    let query = supabase
      .from('photos')
      .select(`
        *,
        events:event_id (name),
        photo_locations:location_id (name)
      `)
      .eq('photographer_id', user.id)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    // Filter by location if provided
    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    const { data, error } = await query

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message
      })
    }

    // Transform response
    const photos = (data || []).map((item: any) => ({
      ...item,
      event_name: item.events?.name,
      location_name: item.photo_locations?.name
    }))

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
