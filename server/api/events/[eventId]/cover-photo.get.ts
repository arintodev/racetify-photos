import { serverSupabaseClient } from '#supabase/server'

/**
 * API endpoint untuk mendapatkan cover photo (latest photo) dari event
 * 
 * Response:
 * - { photo_path: string | null, created_at: string | null }
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

    if (!eventId) {
      throw createError({
        statusCode: 400,
        message: 'Event ID is required'
      })
    }

    // Get latest photo for event
    const { data, error } = await supabase
      .from('photos')
      .select('photo_path, created_at')
      .eq('photographer_id', user.id)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw createError({
        statusCode: 500,
        message: error.message
      })
    }

    return {
      photo_path: data?.photo_path || null,
      created_at: data?.created_at || null
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch cover photo'
    })
  }
})
