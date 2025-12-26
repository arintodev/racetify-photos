<template>
  <div>
    <UHeader>
      <template #left>
        <NuxtLink to="/" class="flex items-center">
          <h1 class="text-lg font-bold">Racetify Photo</h1>
        </NuxtLink>
      </template>

      <template #right>
        <div class="flex items-center gap-3">
          <UButton
            :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
            color="neutral"
            variant="ghost"
            aria-label="Theme"
            @click="isDark = !isDark"
          />
          <UDropdownMenu v-if="isAuthenticated" :items="userMenuItems" :popper="{ placement: 'bottom-end' }">
            <UAvatar
              :src="user?.user_metadata?.avatar_url"
              :alt="user?.user_metadata?.full_name || user?.email"
              class="cursor-pointer uppercase"
            />
          </UDropdownMenu>
          <UButton
            v-if="!isAuthenticated"
            color="primary"
            variant="outline"
            to="/login"
            icon="i-heroicons-arrow-right-on-rectangle"
            label="Login"
          />
        </div>
      </template>
    </UHeader>

    <!-- Page Content -->
    <slot />

    <!-- Footer -->
    <UFooter>
      <template #left>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          © {{ new Date().getFullYear() }} Racetify Photo. All rights reserved.
        </p>
      </template>
    </UFooter>
  </div>
</template>

<script setup lang="ts">
// Check authentication
const { user, fetchUser, isAuthenticated } = useUser()
const { auth } = useSupabase()

// Color mode
const colorMode = useColorMode()
const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
})

// User menu items
const userMenuItems = computed(() => [
  [{
    label: user.value?.user_metadata?.full_name || user.value?.email || 'User',
    slot: 'account',
    disabled: true
  }],
  [{
    label: 'Photographer',
    icon: 'i-heroicons-photo',
    to: '/photographer'
  }],
  [{
    label: 'Logout',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    onSelect: async () => {
      await auth.signOut()
      navigateTo('/login')
    }
  }]
])

// Fetch user on mount
onMounted(async () => {
  await fetchUser()
})
</script>
