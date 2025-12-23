import { serverSupabaseClient } from '#supabase/server'
import type { Event } from '~/types'

/**
 * API endpoint untuk mendapatkan detail event by ID
 * Public endpoint - tidak perlu authentication
 * 
 * Response:
 * - Event object
 */
export default defineEventHandler(async (event): Promise<Event> => {
  try {
    const eventId = getRouterParam(event, 'eventId')

    if (!eventId) {
      throw createError({
        statusCode: 400,
        message: 'Event ID is required'
      })
    }

    // Get Supabase client (no auth required)
    const supabase: any = await serverSupabaseClient(event)

    // Fetch event dari database
    const { data: eventData, error: fetchError } = await supabase
      .from('events')
      .select('id, name, start_date, end_date, location, created_at')
      .eq('id', eventId)
      .single()

    if (fetchError || !eventData) {
      throw createError({
        statusCode: 404,
        message: 'Event not found'
      })
    }

    return eventData as Event

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch event'
    })
  }
})
