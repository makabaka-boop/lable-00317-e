import { create } from 'zustand'

const ROLES_STORAGE_KEY = 'admin_roles_data'

export interface Role {
  id: string
  name: string
  description: string
  isSystem?: boolean
}

const defaultRoles: Role[] = [
  { id: 'admin', name: '超级管理员', description: '拥有所有权限', isSystem: true },
  { id: 'user', name: '普通用户', description: '基础访问权限', isSystem: true },
  { id: 'editor', name: '内容编辑', description: '可以管理用户和查看设置' }
]

const loadRoles = (): Role[] => {
  const saved = localStorage.getItem(ROLES_STORAGE_KEY)
  if (saved) {
    try {
      const data = JSON.parse(saved)
      if (Array.isArray(data) && data.length > 0) {
        return data.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          isSystem: r.isSystem
        }))
      }
    } catch {
      /* ignore */
    }
  }
  return defaultRoles
}

interface RolesState {
  roles: Role[]
  refreshRoles: () => void
}

export const useRolesStore = create<RolesState>((set) => ({
  roles: loadRoles(),

  refreshRoles: () => {
    set({ roles: loadRoles() })
  }
}))
