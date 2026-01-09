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
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  }

  const error = (title: string, description?: string) => {
    toast.add({
      title,
      description,
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  }

  const info = (title: string, description?: string) => {
    toast.add({
      title,
      description,
      color: 'info',
      icon: 'i-lucide-information-circle'
    })
  }

  const warning = (title: string, description?: string) => {
    toast.add({
      title,
      description,
      color: 'warning',
      icon: 'i-lucide-exclamation-triangle'
    })
  }

  return {
    success,
    error,
    info,
    warning
  }
}
