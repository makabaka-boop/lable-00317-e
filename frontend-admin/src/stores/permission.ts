import { create } from 'zustand'
import type { RoleConfig, MenuTreeNode, PermissionRoute } from '@/types'

const STORAGE_KEY = 'admin_permission_data'

export const menuTree: MenuTreeNode[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    icon: 'HomeOutlined',
    path: '/dashboard',
  },
  {
    key: 'users',
    label: '用户管理',
    icon: 'UserOutlined',
    path: '/users',
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: 'SettingOutlined',
    path: '/settings',
  },
  {
    key: 'permission',
    label: '权限配置',
    icon: 'SafetyOutlined',
    path: '/permission',
  },
]

export const allRoutePaths = menuTree
  .filter((n) => n.path)
  .map((n) => n.path!)

export const allMenuKeys = menuTree.map((n) => n.key)

export const defaultButtons: Record<string, { key: string; label: string }[]> = {
  '/dashboard': [
    { key: 'dashboard:view', label: '查看仪表盘' },
  ],
  '/users': [
    { key: 'users:view', label: '查看用户列表' },
    { key: 'users:edit', label: '编辑用户' },
    { key: 'users:delete', label: '删除用户' },
  ],
  '/settings': [
    { key: 'settings:view', label: '查看设置' },
    { key: 'settings:edit', label: '修改设置' },
  ],
  '/permission': [
    { key: 'permission:view', label: '查看权限配置' },
    { key: 'permission:edit', label: '编辑权限配置' },
  ],
}

function buildDefaultRoutes(menuKeys: string[]): PermissionRoute[] {
  return menuKeys
    .map((key) => {
      const node = menuTree.find((n) => n.key === key)
      if (!node?.path) return null
      return {
        path: node.path,
        label: node.label,
        buttons: defaultButtons[node.path] || [],
      }
    })
    .filter(Boolean) as PermissionRoute[]
}

const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19)

const defaultRoles: RoleConfig[] = [
  {
    id: 'role_admin',
    name: '管理员',
    description: '系统管理员，拥有所有权限',
    menuKeys: [...allMenuKeys],
    routes: buildDefaultRoutes([...allMenuKeys]),
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  {
    id: 'role_user',
    name: '普通用户',
    description: '普通用户，仅可访问仪表盘和设置',
    menuKeys: ['dashboard', 'settings'],
    routes: buildDefaultRoutes(['dashboard', 'settings']),
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
]

const loadRoles = (): RoleConfig[] => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      /* ignore */
    }
  }
  return defaultRoles
}

const persist = (roles: RoleConfig[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roles))
}

const legacyRoleMapping: Record<string, string> = {
  admin: 'role_admin',
  user: 'role_user',
}

function resolveRoleId(userRole: string, roles: RoleConfig[]): string | undefined {
  if (roles.some((r) => r.id === userRole)) return userRole
  const mapped = legacyRoleMapping[userRole]
  if (mapped) return mapped
  return undefined
}

interface PermissionState {
  roles: RoleConfig[]
  selectedRoleId: string | null
  addRole: (role: Omit<RoleConfig, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateRole: (id: string, data: Partial<Omit<RoleConfig, 'id' | 'createdAt'>>) => void
  deleteRole: (id: string) => void
  duplicateRole: (id: string) => void
  selectRole: (id: string | null) => void
  getRoleByUserRole: (userRole: string) => RoleConfig | undefined
  getMenuKeysForUserRole: (userRole: string) => string[]
  getRoutesForUserRole: (userRole: string) => PermissionRoute[]
  getButtonKeysForUserRole: (userRole: string, routePath: string) => string[]
  isRouteAccessible: (userRole: string, path: string) => boolean
  isMenuVisible: (userRole: string, menuKey: string) => boolean
  getRoleName: (roleId: string) => string
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  roles: loadRoles(),
  selectedRoleId: null,

  addRole: (role) => {
    set((state) => {
      const id = `role_${Date.now()}`
      const timestamp = now()
      const newRole: RoleConfig = {
        ...role,
        id,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      const roles = [...state.roles, newRole]
      persist(roles)
      return { roles, selectedRoleId: id }
    })
  },

  updateRole: (id, data) => {
    set((state) => {
      const roles = state.roles.map((r) =>
        r.id === id ? { ...r, ...data, updatedAt: now() } : r
      )
      persist(roles)
      return { roles }
    })
  },

  deleteRole: (id) => {
    set((state) => {
      if (id === 'role_admin') return state
      const roles = state.roles.filter((r) => r.id !== id)
      persist(roles)
      return {
        roles,
        selectedRoleId: state.selectedRoleId === id ? null : state.selectedRoleId,
      }
    })
  },

  duplicateRole: (id) => {
    set((state) => {
      const source = state.roles.find((r) => r.id === id)
      if (!source) return state
      const newId = `role_${Date.now()}`
      const timestamp = now()
      const newRole: RoleConfig = {
        ...source,
        id: newId,
        name: `${source.name} (副本)`,
        description: `复制自: ${source.name}`,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      const roles = [...state.roles, newRole]
      persist(roles)
      return { roles, selectedRoleId: newId }
    })
  },

  selectRole: (id) => {
    set({ selectedRoleId: id })
  },

  getRoleByUserRole: (userRole) => {
    const roles = get().roles
    const roleId = resolveRoleId(userRole, roles)
    if (!roleId) return undefined
    return roles.find((r) => r.id === roleId)
  },

  getMenuKeysForUserRole: (userRole) => {
    const role = get().getRoleByUserRole(userRole)
    return role?.menuKeys || []
  },

  getRoutesForUserRole: (userRole) => {
    const role = get().getRoleByUserRole(userRole)
    return role?.routes || []
  },

  getButtonKeysForUserRole: (userRole, routePath) => {
    const routes = get().getRoutesForUserRole(userRole)
    const route = routes.find((r) => r.path === routePath)
    return route?.buttons.map((b) => b.key) || []
  },

  isRouteAccessible: (userRole, path) => {
    const role = get().getRoleByUserRole(userRole)
    if (!role) return false
    return role.routes.some((r) => r.path === path)
  },

  isMenuVisible: (userRole, menuKey) => {
    const role = get().getRoleByUserRole(userRole)
    if (!role) return false
    return role.menuKeys.includes(menuKey)
  },

  getRoleName: (roleId) => {
    const roles = get().roles
    const resolved = resolveRoleId(roleId, roles)
    if (!resolved) return roleId
    const role = roles.find((r) => r.id === resolved)
    return role?.name || roleId
  },
}))
