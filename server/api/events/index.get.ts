import { serverSupabaseClient } from '#supabase/server'
import type { Event } from '~/types'

/**
 * API endpoint untuk mendapatkan list event (public endpoint)
 * 
 * Response:
 * - Array of Event
 */
export default defineEventHandler(async (event) => {
  try {
    // Initialize Supabase client (public access)
    const supabase: any = await serverSupabaseClient(event)

    // Fetch events dari database
    const { data: events, error: fetchError } = await supabase
      .from('events')
      .select('id, name, start_date, end_date, location, created_at')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Fetch events error:', fetchError)
      throw createError({
        statusCode: 500,
        message: 'Gagal mengambil data event'
      })
    }

    return events as Event[]

  } catch (error: any) {
    console.error('Get events error:', error)
    
    throw createError({
      statusCode: 500,
      message: 'Gagal mengambil data event'
    })
  }
})
