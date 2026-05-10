export type UserRole = 'admin' | 'user' | string

export interface User {
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  role: string
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

export interface ButtonPermission {
  key: string
  label: string
}

export interface MenuItemPermission {
  key: string
  path: string
  label: string
  icon?: string
  buttons?: ButtonPermission[]
  children?: MenuItemPermission[]
}

export interface Role {
  id: string
  name: string
  description: string
  menuPermissions: string[]
  buttonPermissions: string[]
  createdAt: string
  updatedAt: string
  isSystem?: boolean
}

export interface RolePermissionDiff {
  addedMenus: string[]
  removedMenus: string[]
  addedButtons: string[]
  removedButtons: string[]
}
