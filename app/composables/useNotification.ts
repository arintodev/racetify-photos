/**
 * Optional: Composable untuk toast notifications
 * Install dulu: npm install @nuxt/ui
 * 
 * Penggunaan:
 * const toast = useToast()
 * toast.add({ title: 'Success', color: 'green' })
 */

export const useNotification = () => {
  const toast = useToast()

  const success = (title: string, description?: string) => {
    toast.add({
      title,
      description,
      color: 'green',
      icon: 'i-heroicons-check-circle'
    })
  }

  const error = (title: string, description?: string) => {
    toast.add({
      title,
      description,
      color: 'red',
      icon: 'i-heroicons-x-circle'
    })
  }

  const info = (title: string, description?: string) => {
    toast.add({
      title,
      description,
      color: 'blue',
      icon: 'i-heroicons-information-circle'
    })
  }

  const warning = (title: string, description?: string) => {
    toast.add({
      title,
      description,
      color: 'yellow',
      icon: 'i-heroicons-exclamation-triangle'
    })
  }

  return {
    success,
    error,
    info,
    warning
  }
}
