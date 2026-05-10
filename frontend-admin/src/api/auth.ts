import type { LoginCredentials, LoginResponse, User, ApiResponse } from '@/types'
import { mockLogin, mockGetUserInfo, mockLogout } from './mock'

export const login = async (credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> => {
  return mockLogin(credentials)
}

export const getUserInfo = async (token: string): Promise<ApiResponse<User>> => {
  return mockGetUserInfo(token)
}

export const logout = async (token: string): Promise<ApiResponse<null>> => {
  return mockLogout(token)
}
