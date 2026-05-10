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
