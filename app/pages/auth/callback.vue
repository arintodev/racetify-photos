<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="text-center">
      <UIcon
        name="i-lucide-loader-circle"
        class="w-12 h-12 mx-auto animate-spin text-primary-500"
      />
      <p class="mt-4 text-gray-600 dark:text-gray-400">
        Memproses login...
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

useHead({
  title: 'Authenticating - Racetify Photos'
})

const route = useRoute()
const user = useSupabaseUser()

onMounted(async () => {
  try {
    // Nuxt Supabase module sudah otomatis handle OAuth callback
    // Kita hanya perlu tunggu user ready
    
    // Tunggu maksimal 5 detik untuk user ready
    let attempts = 0
    while (!user.value && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }

    if (!user.value) {
      // Jika timeout, redirect ke login
      window.location.replace('/login?error=' + encodeURIComponent('Authentication timeout'))
      return
    }

    // Get redirect URL dari query atau default ke photographer
    const redirectTo = route.query.redirect as string || '/'
    
    // Redirect ke halaman tujuan
    window.location.replace(redirectTo)
  } catch (err: any) {
    console.error('Unexpected error:', err)
    window.location.replace('/login?error=' + encodeURIComponent('Unexpected error occurred'))
  }
})
</script>
