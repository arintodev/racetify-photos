import { serverSupabaseClient } from '#supabase/server'
import type { PhotoLocation } from '~/types'

/**
 * API endpoint untuk fetch photo locations berdasarkan event ID
 * 
 * Response:
 * - Array of PhotoLocation objects
 */
export default defineEventHandler(async (event): Promise<PhotoLocation[]> => {
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
        message: 'Unauthorized: Invalid token'
      })
    }

    // Fetch photo locations for the event
    const { data, error } = await supabase
      .from('photo_locations')
      .select('*')
      .eq('event_id', eventId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Fetch locations error:', error)
      throw createError({
        statusCode: 500,
        message: `Failed to fetch locations: ${error.message}`
      })
    }

    return data || []

  } catch (error: any) {
    console.error('Get locations error:', error)
    
    // Re-throw if it's already a createError
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch locations'
    })
  }
})
