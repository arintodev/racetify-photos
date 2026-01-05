/**
 * Middleware untuk photographer check
 * Cek apakah user_id ada di table event_crews dengan role photographer dan status aktif
 * Jika tidak, redirect ke halaman access denied
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser()
  
  // Redirect ke login jika belum authenticated
  if (!user.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }

  // Check photographer access via API
  try {
    const response = await $fetch<{ hasAccess: boolean }>('/api/photographer/check-access')
    
    // If no access, redirect to access denied page
    if (!response.hasAccess) {
      return navigateTo('/photographer/access-denied')
    }
  } catch (error: any) {
    // If unauthorized (401), redirect to login
    if (error.statusCode === 401) {
      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
    
    // For other errors, redirect to access denied
    return navigateTo('/photographer/access-denied')
  }
})
