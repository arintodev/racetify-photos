/**
 * Middleware untuk auth check
 * Redirect ke login jika user belum login
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { fetchUser, isAuthenticated } = useUser()
  
  // Fetch user jika belum ada
  await fetchUser()
  
  // Redirect ke login jika belum authenticated
  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
