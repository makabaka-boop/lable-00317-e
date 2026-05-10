import { defaultMenuTree, findMenuByKey } from '@/stores/permissions'

export const pathToMenuKey = (path: string): string | null => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  const menu = findMenuByKey(defaultMenuTree, cleanPath)
  return menu ? cleanPath : null
}

export const menuKeyToPath = (menuKey: string): string | null => {
  const menu = findMenuByKey(defaultMenuTree, menuKey)
  return menu?.path || null
}
