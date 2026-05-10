import { create } from 'zustand'
import type { Role, MenuItemPermission, RolePermissionDiff } from '@/types'

const ROLES_STORAGE_KEY = 'admin_roles_data'

export const defaultMenuTree: MenuItemPermission[] = [
  {
    key: 'dashboard',
    path: '/dashboard',
    label: '仪表盘',
    icon: 'HomeOutlined',
    buttons: [
      { key: 'dashboard:view', label: '查看仪表盘' },
      { key: 'dashboard:export', label: '导出数据' }
    ]
  },
  {
    key: 'users',
    path: '/users',
    label: '用户管理',
    icon: 'UserOutlined',
    buttons: [
      { key: 'users:view', label: '查看用户' },
      { key: 'users:create', label: '新增用户' },
      { key: 'users:edit', label: '编辑用户' },
      { key: 'users:delete', label: '删除用户' }
    ]
  },
  {
    key: 'roles',
    path: '/roles',
    label: '角色权限配置',
    icon: 'SafetyCertificateOutlined',
    buttons: [
      { key: 'roles:view', label: '查看角色' },
      { key: 'roles:create', label: '新增角色' },
      { key: 'roles:edit', label: '编辑角色' },
      { key: 'roles:delete', label: '删除角色' },
      { key: 'roles:copy', label: '复制角色权限' }
    ]
  },
  {
    key: 'settings',
    path: '/settings',
    label: '系统设置',
    icon: 'SettingOutlined',
    buttons: [
      { key: 'settings:view', label: '查看设置' },
      { key: 'settings:edit', label: '修改设置' }
    ]
  }
]

const defaultRoles: Role[] = [
  {
    id: 'admin',
    name: '超级管理员',
    description: '拥有所有权限',
    menuPermissions: ['dashboard', 'users', 'roles', 'settings'],
    buttonPermissions: [
      'dashboard:view', 'dashboard:export',
      'users:view', 'users:create', 'users:edit', 'users:delete',
      'roles:view', 'roles:create', 'roles:edit', 'roles:delete', 'roles:copy',
      'settings:view', 'settings:edit'
    ],
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
    isSystem: true
  },
  {
    id: 'user',
    name: '普通用户',
    description: '基础访问权限',
    menuPermissions: ['dashboard', 'settings'],
    buttonPermissions: [
      'dashboard:view',
      'settings:view', 'settings:edit'
    ],
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
    isSystem: true
  },
  {
    id: 'editor',
    name: '内容编辑',
    description: '可以管理用户和查看设置',
    menuPermissions: ['dashboard', 'users', 'settings'],
    buttonPermissions: [
      'dashboard:view', 'dashboard:export',
      'users:view', 'users:edit',
      'settings:view'
    ],
    createdAt: '2024-02-01 10:00:00',
    updatedAt: '2024-02-01 10:00:00'
  }
]

const loadRoles = (): Role[] => {
  const saved = localStorage.getItem(ROLES_STORAGE_KEY)
  if (saved) {
    try { return JSON.parse(saved) } catch { /* ignore */ }
  }
  return defaultRoles
}

const saveRoles = (roles: Role[]) => {
  localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles))
}

const getAllMenuKeys = (menus: MenuItemPermission[]): string[] => {
  const keys: string[] = []
  menus.forEach(menu => {
    keys.push(menu.key)
    if (menu.children) {
      keys.push(...getAllMenuKeys(menu.children))
    }
  })
  return keys
}

const getAllButtonKeys = (menus: MenuItemPermission[]): string[] => {
  const keys: string[] = []
  menus.forEach(menu => {
    if (menu.buttons) {
      keys.push(...menu.buttons.map(b => b.key))
    }
    if (menu.children) {
      keys.push(...getAllButtonKeys(menu.children))
    }
  })
  return keys
}

export const findMenuByKey = (menus: MenuItemPermission[], key: string): MenuItemPermission | undefined => {
  for (const menu of menus) {
    if (menu.key === key) return menu
    if (menu.children) {
      const found = findMenuByKey(menu.children, key)
      if (found) return found
    }
  }
  return undefined
}

interface PermissionsState {
  roles: Role[]
  menuTree: MenuItemPermission[]
  currentRoleId: string | null
  compareRoleId: string | null

  setCurrentRole: (roleId: string | null) => void
  setCompareRole: (roleId: string | null) => void
  getRoleById: (roleId: string) => Role | undefined
  createRole: (data: Partial<Role>) => Role
  updateRole: (roleId: string, data: Partial<Role>) => void
  deleteRole: (roleId: string) => void
  copyRole: (sourceRoleId: string, newName: string, newDescription?: string) => Role
  updateRolePermissions: (roleId: string, menuPermissions: string[], buttonPermissions: string[]) => void
  hasMenuPermission: (roleId: string, menuKey: string) => boolean
  hasButtonPermission: (roleId: string, buttonKey: string) => boolean
  getMenuPermissionsForRole: (roleId: string) => string[]
  getButtonPermissionsForRole: (roleId: string) => string[]
  calculateDiff: (roleId1: string, roleId2: string) => RolePermissionDiff
  getAllMenuKeys: () => string[]
  getAllButtonKeys: () => string[]
  resetToDefaults: () => void
}

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  roles: loadRoles(),
  menuTree: defaultMenuTree,
  currentRoleId: null,
  compareRoleId: null,

  setCurrentRole: (roleId) => set({ currentRoleId: roleId }),
  setCompareRole: (roleId) => set({ compareRoleId: roleId }),

  getRoleById: (roleId) => get().roles.find(r => r.id === roleId),

  createRole: (data) => {
    const newRole: Role = {
      id: `role_${Date.now()}`,
      name: data.name || '新角色',
      description: data.description || '',
      menuPermissions: data.menuPermissions || [],
      buttonPermissions: data.buttonPermissions || [],
      createdAt: new Date().toLocaleString('zh-CN'),
      updatedAt: new Date().toLocaleString('zh-CN'),
      isSystem: false
    }
    const roles = [...get().roles, newRole]
    saveRoles(roles)
    set({ roles })
    return newRole
  },

  updateRole: (roleId, data) => {
    const roles = get().roles.map(r =>
      r.id === roleId ? { ...r, ...data, updatedAt: new Date().toLocaleString('zh-CN') } : r
    )
    saveRoles(roles)
    set({ roles })
  },

  deleteRole: (roleId) => {
    const role = get().getRoleById(roleId)
    if (role?.isSystem) return
    const roles = get().roles.filter(r => r.id !== roleId)
    saveRoles(roles)
    set({
      roles,
      currentRoleId: get().currentRoleId === roleId ? null : get().currentRoleId,
      compareRoleId: get().compareRoleId === roleId ? null : get().compareRoleId
    })
  },

  copyRole: (sourceRoleId, newName, newDescription) => {
    const sourceRole = get().getRoleById(sourceRoleId)
    if (!sourceRole) {
      throw new Error('源角色不存在')
    }
    const newRole: Role = {
      id: `role_${Date.now()}`,
      name: newName,
      description: newDescription || `${sourceRole.description} (副本)`,
      menuPermissions: [...sourceRole.menuPermissions],
      buttonPermissions: [...sourceRole.buttonPermissions],
      createdAt: new Date().toLocaleString('zh-CN'),
      updatedAt: new Date().toLocaleString('zh-CN'),
      isSystem: false
    }
    const roles = [...get().roles, newRole]
    saveRoles(roles)
    set({ roles })
    return newRole
  },

  updateRolePermissions: (roleId, menuPermissions, buttonPermissions) => {
    const roles = get().roles.map(r =>
      r.id === roleId ? {
        ...r,
        menuPermissions,
        buttonPermissions,
        updatedAt: new Date().toLocaleString('zh-CN')
      } : r
    )
    saveRoles(roles)
    set({ roles })
  },

  hasMenuPermission: (roleId, menuKey) => {
    const role = get().getRoleById(roleId)
    if (!role) return false
    if (role.isSystem && role.id === 'admin') return true
    return role.menuPermissions.includes(menuKey)
  },

  hasButtonPermission: (roleId, buttonKey) => {
    const role = get().getRoleById(roleId)
    if (!role) return false
    if (role.isSystem && role.id === 'admin') return true
    return role.buttonPermissions.includes(buttonKey)
  },

  getMenuPermissionsForRole: (roleId) => {
    const role = get().getRoleById(roleId)
    if (!role) return []
    if (role.isSystem && role.id === 'admin') {
      return getAllMenuKeys(get().menuTree)
    }
    return role.menuPermissions
  },

  getButtonPermissionsForRole: (roleId) => {
    const role = get().getRoleById(roleId)
    if (!role) return []
    if (role.isSystem && role.id === 'admin') {
      return getAllButtonKeys(get().menuTree)
    }
    return role.buttonPermissions
  },

  calculateDiff: (roleId1, roleId2) => {
    const role1 = get().getRoleById(roleId1)
    const role2 = get().getRoleById(roleId2)
    if (!role1 || !role2) {
      return { addedMenus: [], removedMenus: [], addedButtons: [], removedButtons: [] }
    }

    const menus1 = new Set(role1.menuPermissions)
    const menus2 = new Set(role2.menuPermissions)
    const buttons1 = new Set(role1.buttonPermissions)
    const buttons2 = new Set(role2.buttonPermissions)

    return {
      addedMenus: [...menus1].filter(m => !menus2.has(m)),
      removedMenus: [...menus2].filter(m => !menus1.has(m)),
      addedButtons: [...buttons1].filter(b => !buttons2.has(b)),
      removedButtons: [...buttons2].filter(b => !buttons1.has(b))
    }
  },

  getAllMenuKeys: () => getAllMenuKeys(get().menuTree),
  getAllButtonKeys: () => getAllButtonKeys(get().menuTree),

  resetToDefaults: () => {
    saveRoles(defaultRoles)
    set({ roles: [...defaultRoles], currentRoleId: null, compareRoleId: null })
  }
}))
