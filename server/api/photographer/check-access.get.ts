import { serverSupabaseClient } from '#supabase/server'

/**
 * API endpoint untuk check photographer access
 * Cek apakah user_id ada di table event_crews dengan role photographer dan status aktif
 * 
 * Response:
 * - { hasAccess: true } jika user adalah photographer aktif
 * - { hasAccess: false } jika user bukan photographer atau tidak aktif
 */
export default defineEventHandler(async (event) => {
  try {
    const supabase: any = await serverSupabaseClient(event)
    
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    
    if (!user) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    // Check if user is photographer in event_crews table
    const { data, error } = await supabase
      .from('event_crews')
      .select('role, status')
      .eq('user_id', user.id)
      .eq('role', 'photographer')
      .eq('status', 'active')
      .limit(1)
      .single()

    // Return access status
    return {
      hasAccess: !error && !!data
    }
  } catch (error: any) {
    console.error('Check photographer access error:', error)
    
    // If it's auth error, throw it
    if (error.statusCode === 401) {
      throw error
    }
    
    // Otherwise return no access
    return {
      hasAccess: false
    }
  }
})
