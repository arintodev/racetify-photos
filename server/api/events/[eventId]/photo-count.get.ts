import { serverSupabaseClient } from '#supabase/server'

/**
 * API endpoint untuk mendapatkan jumlah foto dalam event
 * Dengan optional filter location_id via query params
 * 
 * Query params:
 * - location_id (optional): count photos in specific location
 * 
 * Response:
 * - { count: number }
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
      .select('*', { count: 'exact', head: true })
      .eq('photographer_id', user.id)
      .eq('event_id', eventId)

    // Filter by location if provided
    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    const { count, error } = await query

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message
      })
    }

    return { count: count || 0 }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to count photos'
    })
  }
})
