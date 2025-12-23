import { serverSupabaseClient } from '#supabase/server'
import type { PhotoWithBibs } from '~/types'

/**
 * API endpoint untuk search foto berdasarkan bib number
 * Public endpoint - tidak perlu authentication
 * 
 * Query params:
 * - bib: string (bib number yang dicari)
 * - eventId: string (optional, untuk filter berdasarkan event)
 * 
 * Response:
 * - Array of photos with their details and public URLs
 */
export default defineEventHandler(async (event): Promise<PhotoWithBibs[]> => {
  try {
    const query = getQuery(event)
    const bibNumber = query.bib as string
    const eventId = query.eventId as string | undefined

    // Validate bib number
    if (!bibNumber) {
      throw createError({
        statusCode: 400,
        message: 'Bib number is required'
      })
    }

    // Get Supabase client (no auth required for public search)
    const supabase: any = await serverSupabaseClient(event)

    // Build query untuk search photos berdasarkan bib number
    // Join dengan photo_bibs table
    let photoQuery = supabase
      .from('photos')
      .select(`
        *,
        photo_bibs!inner (
          id,
          bib_number
        )
      `)
      .eq('photo_bibs.bib_number', bibNumber)
      .eq('status', 'completed') // Only show completed/processed photos

    // Filter by event if provided
    if (eventId) {
      photoQuery = photoQuery.eq('event_id', eventId)
    }

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
          photographer_id: item.photographer_id,
          photo_path: item.photo_path,
          location_id: item.location_id,
          status: item.status,
          created_at: item.created_at,
          updated_at: item.updated_at,
          photo_bibs: item.photo_bibs,
          public_url: urlData.publicUrl,
          event: item.events,
          location: item.photo_locations
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
