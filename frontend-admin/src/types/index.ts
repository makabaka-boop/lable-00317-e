export type UserRole = string

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

export interface PermissionButton {
  key: string
  label: string
}

export interface PermissionRoute {
  path: string
  label: string
  buttons: PermissionButton[]
}

export interface MenuTreeNode {
  key: string
  label: string
  icon?: string
  path?: string
  children?: MenuTreeNode[]
}

export interface RoleConfig {
  id: string
  name: string
  description: string
  menuKeys: string[]
  routes: PermissionRoute[]
  createdAt: string
  updatedAt: string
}
