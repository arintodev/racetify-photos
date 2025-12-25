<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Racetify Photos
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Login untuk upload foto event
          </p>
        </div>
      </template>

      <div v-if="loading" class="text-center py-8">
        <UIcon name="i-lucide-loader-circle" class="w-8 h-8 mx-auto animate-spin" />
        <p class="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>

      <div v-else class="space-y-4">
        <UAlert
          v-if="error"
          color="red"
          variant="soft"
          :title="error"
          @close="error = ''"
        />

        <!-- Email & Password Form -->
        <form @submit.prevent="handleLoginWithEmail" class="space-y-4">
          <UFormField label="Email" name="email" required>
            <UInput
              v-model="email"
              type="email"
              class="w-full"
              placeholder="fotografer@example.com"
              :disabled="loading"
              icon="i-lucide-mail"
            />
          </UFormField>

          <UFormField label="Password" name="password" required>
            <UInput
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="w-full"
              placeholder="••••••••"
              :disabled="loading"
              icon="i-lucide-lock"
              :ui="{ trailing: 'pe-1' }"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  :aria-pressed="showPassword"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
          </UFormField>

          <UButton
            type="submit"
            block
            size="lg"
            color="primary"
            :disabled="loading || !email || !password"
            :loading="loading"
          >
            <UIcon name="i-lucide-log-in" class="mr-2" />
            Login
          </UButton>
        </form>

        <!-- Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500">atau</span>
          </div>
        </div>

        <!-- OAuth Login -->
        <UButton
          block
          size="lg"
          color="neutral"
          variant="solid"
          @click="handleLoginWithGoogle"
          :disabled="loading"
        >
          <UIcon name="i-lucide-globe" class="mr-2" />
          Login dengan Google
        </UButton>

        <p class="text-xs text-center text-gray-500">
          Hubungi admin jika Anda belum memiliki akses sebagai fotografer
        </p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Login - Racetify Photos'
})

const { auth } = useSupabase()
const loading = ref(false)
const error = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)

// Check if already logged in
onMounted(async () => {
  const { data: { session } } = await auth.getSession()
  if (session) {
    navigateTo('/photographer')
  }
})

/**
 * Handle login dengan email & password
 */
const handleLoginWithEmail = async () => {
  try {
    loading.value = true
    error.value = ''

    const { data, error: signInError } = await auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (signInError) throw signInError

    if (data.session) {
      navigateTo('/gallery')
    }

  } catch (err: any) {
    error.value = err.message || 'Login gagal. Periksa email dan password Anda.'
    loading.value = false
  }
}

/**
 * Handle login dengan Google OAuth
 */
const handleLoginWithGoogle = async () => {
  try {
    loading.value = true
    error.value = ''

    const { error: signInError } = await auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/upload`
      }
    })

    if (signInError) throw signInError

  } catch (err: any) {
    error.value = err.message || 'Login gagal'
    loading.value = false
  }
}
</script>
