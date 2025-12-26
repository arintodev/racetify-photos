import { serverSupabaseClient } from '#supabase/server'
import type { PhotoWithBibs } from '~/types'

/**
 * API endpoint untuk search foto berdasarkan bib number dalam event tertentu
 * Public endpoint - tidak perlu authentication
 * 
 * Route params:
 * - eventId: string (ID event yang dicari)
 * 
 * Query params:
 * - bib: string (bib number yang dicari)
 * - limit: number (optional, default: 1000)
 * - offset: number (optional, default: 0)
 * 
 * Response:
 * - Array of photos with their details and public URLs
 */
export default defineEventHandler(async (event): Promise<PhotoWithBibs[]> => {
  try {
    const eventId = getRouterParam(event, 'eventId')
    const query = getQuery(event)
    const bibNumber = query.bib as string
    const limit = parseInt(query.limit as string) || 1000
    const offset = parseInt(query.offset as string) || 0

    // Validate event ID
    if (!eventId) {
      throw createError({
        statusCode: 400,
        message: 'Event ID is required'
      })
    }

    // Validate bib number
    if (!bibNumber) {
      throw createError({
        statusCode: 400,
        message: 'Bib number is required'
      })
    }

    // Get Supabase client (no auth required for public search)
    const supabase: any = await serverSupabaseClient(event)

    // Build query untuk search photos berdasarkan bib number dan event
    // Join dengan photo_bibs table
    const photoQuery = supabase
      .from('photos')
      .select(`
        id,
        status,
        photo_path,
        event_id,
        created_at,
        location_id,
        photo_bibs!inner (
          id,
          bib_number
        ),
        photo_locations (
          name
        )
      `)
      .eq('photo_bibs.bib_number', bibNumber)
      .eq('event_id', eventId)
      .eq('status', 'completed') // Only show completed/processed photos
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error } = await photoQuery

    if (error) {
      console.error('Search error:', error)
      throw createError({
        statusCode: 500,
        message: `Failed to search photos: ${error.message}`
      })
    }

    // Transform response and generate public URLs
    const photos: PhotoWithBibs[] = await Promise.all(
      (data || []).map(async (item: any) => {
        // Get public URL for the photo
        const { data: urlData } = supabase
          .storage
          .from('event-photos')
          .getPublicUrl(item.photo_path)

        return {
          id: item.id,
          event_id: item.event_id,
          location_id: item.location_id,
          location_name: item.photo_locations?.name,
          status: item.status,
          created_at: item.created_at,
          bib_numbers: item.photo_bibs.map((b: any) => b.bib_number),
          public_url: urlData.publicUrl
        }
      })
    )

    return photos

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to search photos by bib number'
    })
  }
})
