import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const token = useAuthStore.getState().token
    if (!token) {
      throw redirect({ to: '/login', search: { redirect: undefined } })
    }
    throw redirect({ to: '/dashboard' })
  }
})
