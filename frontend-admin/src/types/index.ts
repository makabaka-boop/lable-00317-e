export type UserRole = 'admin' | 'user'

export interface User {
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  role: UserRole
  createdAt: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface MenuPermission {
  key: string
  title: string
  children?: MenuPermission[]
  actions?: string[]
}

export interface Role {
  id: string
  name: string
  code: string
  description: string
  menuPermissions: string[]
  actionPermissions: string[]
  createdAt: string
  updatedAt: string
}

export interface RolePermission {
  menuKeys: string[]
  actions: string[]
}

export interface PermissionDiff {
  added: string[]
  removed: string[]
}

