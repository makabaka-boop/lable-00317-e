import type { User, LoginCredentials, LoginResponse, ApiResponse } from '@/types'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const passwordMap: Record<string, string> = {
  admin: 'admin123',
  user: 'user123'
}

const getStoredUsers = (): any[] => {
  try {
    const saved = localStorage.getItem('admin_users_data')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {
    /* ignore */
  }
  return [
    { id: 1, username: 'admin', nickname: '系统管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', email: 'admin@example.com', role: 'admin', status: 'active', createdAt: '2024-01-01 00:00:00' },
    { id: 2, username: 'user', nickname: '普通用户', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user', email: 'user@example.com', role: 'user', status: 'active', createdAt: '2024-03-15 10:30:00' },
    { id: 3, username: 'zhangsan', nickname: '张三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan', email: 'zhangsan@example.com', role: 'user', status: 'active', createdAt: '2024-02-15 10:30:00' },
    { id: 4, username: 'lisi', nickname: '李四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi', email: 'lisi@example.com', role: 'user', status: 'inactive', createdAt: '2024-03-20 14:20:00' }
  ]
}

const findUserByUsername = (username: string): User | null => {
  const users = getStoredUsers()
  const found = users.find(u => u.username === username)
  if (!found) return null
  return {
    id: found.id,
    username: found.username,
    nickname: found.nickname,
    avatar: found.avatar,
    email: found.email,
    role: found.role,
    createdAt: found.createdAt
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
  const password = passwordMap[credentials.username]
  
  if (!password) {
    return { code: 401, message: '用户不存在', data: null as unknown as LoginResponse }
  }
  
  if (password !== credentials.password) {
    return { code: 401, message: '密码错误', data: null as unknown as LoginResponse }
  }
  
  const user = findUserByUsername(credentials.username)
  if (!user) {
    return { code: 401, message: '用户信息获取失败', data: null as unknown as LoginResponse }
  }
  
  const token = generateToken(credentials.username)
  return { code: 200, message: '登录成功', data: { token, user } }
}

export const mockGetUserInfo = async (token: string): Promise<ApiResponse<User>> => {
  await delay(500)
  let username = tokenUserMap.get(token)
  
  if (!username) {
    const storedToken = localStorage.getItem('token')
    if (storedToken === token) {
      const match = token.match(/mock_token_(\w+)_/)
      if (match) {
        username = match[1]
      }
    }
  }
  
  if (!username) {
    return { code: 401, message: 'Token 无效或已过期', data: null as unknown as User }
  }
  
  const user = findUserByUsername(username)
  if (!user) {
    return { code: 401, message: '用户不存在', data: null as unknown as User }
  }
  
  return { code: 200, message: '获取成功', data: user }
}

export const mockLogout = async (token: string): Promise<ApiResponse<null>> => {
  await delay(300)
  tokenUserMap.delete(token)
  return { code: 200, message: '登出成功', data: null }
}
