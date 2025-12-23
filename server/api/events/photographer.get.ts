import { serverSupabaseClient } from '#supabase/server'
import type { Event } from '~/types'

/**
 * API endpoint untuk fetch events berdasarkan event_crews
 * Hanya menampilkan event dimana user adalah photographer
 * 
 * Response:
 * - Array of Event objects where user is photographer
 */
export default defineEventHandler(async (event): Promise<Event[]> => {
  try {
    const supabase: any = await serverSupabaseClient(event)
    
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    // Fetch events where user is a photographer from event_crews
    const { data, error } = await supabase
      .from('event_crews')
      .select(`
        event_id,
        events:event_id (
          id,
          name,
          start_date,
          end_date,
          location,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('role', 'photographer')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch photographer events error:', error)
      throw createError({
        statusCode: 500,
        message: `Failed to fetch events: ${error.message}`
      })
    }

    // Transform data to return only events
    const events = (data || [])
      .filter(item => item.events !== null)
      .map(item => item.events as any)

    return events

  } catch (error: any) {
    console.error('Get photographer events error:', error)

    // Re-throw if it's already a createError
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch photographer events'
    })
  }
})
