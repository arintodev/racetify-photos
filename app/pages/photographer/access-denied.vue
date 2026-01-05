<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4">
    <div class="max-w-md w-full text-center">
      <!-- Icon -->
      <div class="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <UIcon name="i-lucide-shield-alert" class="w-12 h-12 text-red-600 dark:text-red-400" />
      </div>

      <!-- Title -->
      <h1 class="text-3xl font-bold text-highlighted mb-4">
        Belum Punya Akses
      </h1>

      <!-- Description -->
      <p class="text-muted mb-8 text-lg">
        Anda belum memiliki akses sebagai photographer. Silakan hubungi administrator untuk mendapatkan akses.
      </p>

      <!-- Additional Info -->
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-8 text-left">
        <h3 class="font-semibold text-highlighted mb-2">Untuk mendapatkan akses:</h3>
        <ul class="text-muted space-y-2 text-sm">
          <li class="flex items-start">
            <UIcon name="i-lucide-check" class="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Hubungi administrator event</span>
          </li>
          <li class="flex items-start">
            <UIcon name="i-lucide-check" class="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Pastikan anda terdaftar sebagai photographer</span>
          </li>
          <li class="flex items-start">
            <UIcon name="i-lucide-check" class="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Status akun anda harus aktif</span>
          </li>
        </ul>
      </div>

      <!-- Back to Home Button -->
      <UButton
        size="lg"
        color="primary"
        variant="solid"
        icon="i-lucide-home"
        @click="navigateTo('/')"
        class="w-full"
      >
        Kembali ke Home
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false, // Disable default layout untuk full page experience
  middleware: 'auth' // Still need auth check
})

useHead({
  title: 'Access Denied - Racetify Photos'
})
</script>
