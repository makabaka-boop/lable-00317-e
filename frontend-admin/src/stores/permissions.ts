import { create } from 'zustand'
import type { Role, MenuPermission, PermissionDiff } from '@/types'

const STORAGE_KEY_ROLES = 'admin_roles_data'
const STORAGE_KEY_USER_ROLES = 'admin_user_roles_map'

export const menuTreeData: MenuPermission[] = [
  {
    key: '/dashboard',
    title: '仪表盘',
    actions: ['view', 'export']
  },
  {
    key: '/users',
    title: '用户管理',
    actions: ['view', 'add', 'edit', 'delete', 'export']
  },
  {
    key: '/roles',
    title: '角色权限配置中心',
    actions: ['view', 'add', 'edit', 'delete', 'copy', 'export']
  },
  {
    key: '/settings',
    title: '系统设置',
    children: [
      {
        key: '/settings/basic',
        title: '基础设置',
        actions: ['view', 'edit']
      },
      {
        key: '/settings/security',
        title: '安全设置',
        actions: ['view', 'edit']
      }
    ],
    actions: ['view']
  }
]

const getAllMenuKeys = (menus: MenuPermission[]): string[] => {
  const keys: string[] = []
  menus.forEach(menu => {
    keys.push(menu.key)
    if (menu.children) {
      keys.push(...getAllMenuKeys(menu.children))
    }
  })
  return keys
}

const getAllActionKeys = (menus: MenuPermission[]): string[] => {
  const keys: string[] = []
  menus.forEach(menu => {
    if (menu.actions) {
      menu.actions.forEach(action => {
        keys.push(`${menu.key}:${action}`)
      })
    }
    if (menu.children) {
      keys.push(...getAllActionKeys(menu.children))
    }
  })
  return keys
}

const defaultRoles: Role[] = [
  {
    id: '1',
    name: '超级管理员',
    code: 'admin',
    description: '拥有系统所有权限',
    menuPermissions: getAllMenuKeys(menuTreeData),
    actionPermissions: getAllActionKeys(menuTreeData),
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00'
  },
  {
    id: '2',
    name: '普通用户',
    code: 'user',
    description: '基础访问权限',
    menuPermissions: ['/dashboard', '/settings', '/settings/basic'],
    actionPermissions: ['/dashboard:view', '/settings:view', '/settings/basic:view'],
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00'
  },
  {
    id: '3',
    name: '运营专员',
    code: 'operator',
    description: '用户管理与数据查看权限',
    menuPermissions: ['/dashboard', '/users'],
    actionPermissions: ['/dashboard:view', '/dashboard:export', '/users:view', '/users:add', '/users:edit', '/users:export'],
    createdAt: '2024-03-01 10:00:00',
    updatedAt: '2024-03-01 10:00:00'
  }
]

const defaultUserRoleMap: Record<string, string> = {
  admin: '1',
  user: '2',
  zhangsan: '3',
  lisi: '2'
}

const loadRoles = (): Role[] => {
  const saved = localStorage.getItem(STORAGE_KEY_ROLES)
  if (saved) {
    try { return JSON.parse(saved) } catch { /* ignore */ }
  }
  return defaultRoles
}

const loadUserRoleMap = (): Record<string, string> => {
  const saved = localStorage.getItem(STORAGE_KEY_USER_ROLES)
  if (saved) {
    try { return JSON.parse(saved) } catch { /* ignore */ }
  }
  return defaultUserRoleMap
}

interface PermissionsState {
  roles: Role[]
  userRoleMap: Record<string, string>
  selectedRoleId: string | null
  editingRole: Role | null
  tempMenuPermissions: string[]
  tempActionPermissions: string[]

  setSelectedRoleId: (id: string | null) => void
  setEditingRole: (role: Role | null) => void
  setTempMenuPermissions: (keys: string[]) => void
  setTempActionPermissions: (keys: string[]) => void

  addRole: (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateRole: (id: string, data: Partial<Role>) => void
  deleteRole: (id: string) => void
  copyRole: (id: string, newName: string, newCode: string) => void
  saveRolePermissions: (id: string) => void

  getUserRole: (username: string) => Role | null
  hasMenuPermission: (username: string, menuKey: string) => boolean
  hasActionPermission: (username: string, actionKey: string) => boolean
  getUserMenuPermissions: (username: string) => string[]
  getUserActionPermissions: (username: string) => string[]

  getPermissionDiff: (roleId: string) => PermissionDiff

  assignUserRole: (username: string, roleId: string) => void
  getUserRoleId: (username: string) => string | null
}

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  roles: loadRoles(),
  userRoleMap: loadUserRoleMap(),
  selectedRoleId: null,
  editingRole: null,
  tempMenuPermissions: [],
  tempActionPermissions: [],

  setSelectedRoleId: (id) => set({ selectedRoleId: id }),
  setEditingRole: (role) => set({ editingRole: role }),
  setTempMenuPermissions: (keys) => set({ tempMenuPermissions: keys }),
  setTempActionPermissions: (keys) => set({ tempActionPermissions: keys }),

  addRole: (roleData) => {
    set(state => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
      const newRole: Role = {
        ...roleData,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now
      }
      const roles = [...state.roles, newRole]
      localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles))
      return { roles, selectedRoleId: newRole.id }
    })
  },

  updateRole: (id, data) => {
    set(state => {
      const roles = state.roles.map(r =>
        r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) } : r
      )
      localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles))
      return { roles }
    })
  },

  deleteRole: (id) => {
    set(state => {
      const roles = state.roles.filter(r => r.id !== id)
      localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles))
      return { roles, selectedRoleId: state.selectedRoleId === id ? null : state.selectedRoleId }
    })
  },

  copyRole: (id, newName, newCode) => {
    set(state => {
      const sourceRole = state.roles.find(r => r.id === id)
      if (!sourceRole) return state

      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
      const newRole: Role = {
        ...sourceRole,
        id: Date.now().toString(),
        name: newName,
        code: newCode,
        description: `${sourceRole.description} (副本)`,
        createdAt: now,
        updatedAt: now
      }
      const roles = [...state.roles, newRole]
      localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles))
      return { roles, selectedRoleId: newRole.id }
    })
  },

  saveRolePermissions: (id) => {
    set(state => {
      const roles = state.roles.map(r =>
        r.id === id
          ? {
              ...r,
              menuPermissions: state.tempMenuPermissions,
              actionPermissions: state.tempActionPermissions,
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
            }
          : r
      )
      localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles))
      return { roles, editingRole: null }
    })
  },

  getUserRole: (username) => {
    const roleId = get().userRoleMap[username]
    return get().roles.find(r => r.id === roleId) || null
  },

  hasMenuPermission: (username, menuKey) => {
    const role = get().getUserRole(username)
    return role?.menuPermissions.includes(menuKey) || false
  },

  hasActionPermission: (username, actionKey) => {
    const role = get().getUserRole(username)
    return role?.actionPermissions.includes(actionKey) || false
  },

  getUserMenuPermissions: (username) => {
    const role = get().getUserRole(username)
    return role?.menuPermissions || []
  },

  getUserActionPermissions: (username) => {
    const role = get().getUserRole(username)
    return role?.actionPermissions || []
  },

  getPermissionDiff: (roleId) => {
    const role = get().roles.find(r => r.id === roleId)
    if (!role) return { added: [], removed: [] }

    const tempMenus = new Set(get().tempMenuPermissions)
    const originalMenus = new Set(role.menuPermissions)

    const added: string[] = []
    const removed: string[] = []

    tempMenus.forEach(key => {
      if (!originalMenus.has(key)) added.push(key)
    })
    originalMenus.forEach(key => {
      if (!tempMenus.has(key)) removed.push(key)
    })

    return { added, removed }
  },

  assignUserRole: (username, roleId) => {
    set(state => {
      const userRoleMap = {
        ...state.userRoleMap,
        [username]: roleId
      }
      localStorage.setItem(STORAGE_KEY_USER_ROLES, JSON.stringify(userRoleMap))
      return { userRoleMap }
    })
  },

  getUserRoleId: (username) => {
    return get().userRoleMap[username] || null
  }
}))
