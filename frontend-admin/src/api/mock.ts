import type { User, LoginCredentials, LoginResponse, ApiResponse } from '@/types'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const mockUsers: Record<string, { password: string; user: User }> = {
  admin: {
    password: 'admin123',
    user: {
      id: 1,
      username: 'admin',
      nickname: '系统管理员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      email: 'admin@example.com',
      role: 'admin',
      createdAt: '2024-01-01 00:00:00'
    }
  },
  user: {
    password: 'user123',
    user: {
      id: 2,
      username: 'user',
      nickname: '普通用户',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
      email: 'user@example.com',
      role: 'user',
      createdAt: '2024-03-15 10:30:00'
    }
  }
}

const tokenUserMap = new Map<string, string>()

const generateToken = (username: string): string => {
  const token = `mock_token_${username}_${Date.now()}`
  tokenUserMap.set(token, username)
  return token
}

export const mockLogin = async (credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> => {
  await delay(800)
  const userData = mockUsers[credentials.username]
  
  if (!userData) {
    return { code: 401, message: '用户不存在', data: null as unknown as LoginResponse }
  }
  
  if (userData.password !== credentials.password) {
    return { code: 401, message: '密码错误', data: null as unknown as LoginResponse }
  }
  
  const token = generateToken(credentials.username)
  return { code: 200, message: '登录成功', data: { token, user: userData.user } }
}

export const mockGetUserInfo = async (token: string): Promise<ApiResponse<User>> => {
  await delay(500)
  const username = tokenUserMap.get(token)
  
  if (!username) {
    const storedToken = localStorage.getItem('token')
    if (storedToken === token) {
      const match = token.match(/mock_token_(\w+)_/)
      if (match && mockUsers[match[1]]) {
        return { code: 200, message: '获取成功', data: mockUsers[match[1]].user }
      }
    }
    return { code: 401, message: 'Token 无效或已过期', data: null as unknown as User }
  }
  
  return { code: 200, message: '获取成功', data: mockUsers[username].user }
}

export const mockLogout = async (token: string): Promise<ApiResponse<null>> => {
  await delay(300)
  tokenUserMap.delete(token)
  return { code: 200, message: '登出成功', data: null }
}
