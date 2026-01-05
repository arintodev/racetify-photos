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
 * Menggunakan useSupabaseUser dari Nuxt module (sudah auto-managed dan cached)
 */
export const useUser = () => {
  const user = useSupabaseUser()

  return {
    user,
    isAuthenticated: computed(() => !!user.value)
  }
}

/**
 * Composable untuk API calls dengan auth header otomatis
 */
export const useAuthFetch = () => {
  const user = useSupabaseUser()

  /**
   * Fetch dengan Authorization header otomatis
   * Menggunakan user dari Nuxt Supabase module (sudah di-cache)
   */
  const authFetch = async <T = any>(url: string, options: any = {}): Promise<T> => {
    if (!user.value) {
      throw new Error('No active session')
    }

    // Dapatkan access token dari cookie/localStorage yang sudah di-manage Nuxt
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No access token available')
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
