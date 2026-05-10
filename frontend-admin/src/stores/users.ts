import { create } from 'zustand'

export interface UserItem {
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  role: string
  status: 'active' | 'inactive'
  createdAt: string
}

const STORAGE_KEY = 'admin_users_data'

const defaultUsers: UserItem[] = [
  { id: 1, username: 'admin', nickname: '系统管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', email: 'admin@example.com', role: 'admin', status: 'active', createdAt: '2024-01-01 00:00:00' },
  { id: 2, username: 'user', nickname: '普通用户', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user', email: 'user@example.com', role: 'user', status: 'active', createdAt: '2024-03-15 10:30:00' },
  { id: 3, username: 'zhangsan', nickname: '张三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan', email: 'zhangsan@example.com', role: 'user', status: 'active', createdAt: '2024-02-15 10:30:00' },
  { id: 4, username: 'lisi', nickname: '李四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi', email: 'lisi@example.com', role: 'user', status: 'inactive', createdAt: '2024-03-20 14:20:00' }
]

const loadUsers = (): UserItem[] => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try { return JSON.parse(saved) } catch { /* ignore */ }
  }
  return defaultUsers
}

interface UsersState {
  users: UserItem[]
  updateUser: (id: number, data: Partial<UserItem>) => void
  getUserByUsername: (username: string) => UserItem | undefined
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: loadUsers(),

  updateUser: (id, data) => {
    set(state => {
      const users = state.users.map(u => u.id === id ? { ...u, ...data } : u)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
      return { users }
    })
  },

  getUserByUsername: (username) => {
    return get().users.find(u => u.username === username)
  }
}))
