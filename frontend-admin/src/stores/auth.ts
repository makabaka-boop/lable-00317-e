import { create } from 'zustand'
import type { User, LoginCredentials } from '@/types'
import * as authApi from '@/api/auth'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  isAuthenticated: false,

  login: async (credentials) => {
    set({ loading: true })
    try {
      const res = await authApi.login(credentials)
      if (res.code === 200 && res.data) {
        localStorage.setItem('token', res.data.token)
        set({ token: res.data.token, user: res.data.user, isAuthenticated: true })
      } else {
        throw new Error(res.message || '登录失败')
      }
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    const { token } = get()
    if (token) {
      await authApi.logout(token)
    }
    localStorage.removeItem('token')
    set({ token: null, user: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    const { token } = get()
    if (!token) return false

    set({ loading: true })
    try {
      const res = await authApi.getUserInfo(token)
      if (res.code === 200 && res.data) {
        set({ user: res.data, isAuthenticated: true })
        return true
      } else {
        localStorage.removeItem('token')
        set({ token: null, user: null, isAuthenticated: false })
        return false
      }
    } catch {
      localStorage.removeItem('token')
      set({ token: null, user: null, isAuthenticated: false })
      return false
    } finally {
      set({ loading: false })
    }
  }
}))
