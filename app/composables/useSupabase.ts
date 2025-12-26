/**
 * Composable untuk Supabase client (client-side)
 * Menggunakan @nuxtjs/supabase module
 */
export const useSupabase = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  return {
    supabase,
    auth: supabase.auth,
    user
  }
}

/**
 * Composable untuk mendapatkan user yang sedang login
 */
export const useUser = () => {
  const user = useSupabaseUser()
  const { auth } = useSupabase()

  // Get current user
  const fetchUser = async () => {
    const { data } = await auth.getUser()
    return data.user
  }

  // Check if user is authenticated
  const isAuthenticated = computed(() => !!user.value)

  return {
    user,
    isAuthenticated,
    fetchUser
  }
}

/**
 * Composable untuk API calls dengan auth header otomatis
 */
export const useAuthFetch = () => {
  const { auth } = useSupabase()

  /**
   * Fetch dengan Authorization header otomatis
   */
  const authFetch = async <T = any>(url: string, options: any = {}): Promise<T> => {
    const { data: { session } } = await auth.getSession()
    
    if (!session) {
      throw new Error('No active session')
    }

    return $fetch<T>(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${session.access_token}`
      }
    })
  }

  return {
    authFetch
  }
}
