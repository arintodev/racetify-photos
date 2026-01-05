/**
 * Middleware untuk auth check
 * Redirect ke login jika user belum login
 */
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useSupabaseUser()
  
  // Redirect ke login jika belum authenticated
  if (!user.value) {
    // Save redirect URL to return after login
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})
