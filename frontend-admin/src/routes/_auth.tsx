import { createFileRoute, Outlet, redirect, useNavigate, useLocation } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Layout, Menu, Dropdown, Avatar, Spin, Tag } from 'antd'
import {
  HomeOutlined, UserOutlined, SettingOutlined, LogoutOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, SafetyCertificateOutlined
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { usePermissionsStore } from '@/stores/permissions'
import { pathToMenuKey } from '@/utils/permissions'
import './auth.scss'

const { Sider, Header, Content } = Layout

const iconMap: Record<string, React.ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  UserOutlined: <UserOutlined />,
  SettingOutlined: <SettingOutlined />,
  SafetyCertificateOutlined: <SafetyCertificateOutlined />
}

function AuthLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, checkAuth, loading, isAuthenticated } = useAuthStore()
  const { getUserByUsername } = useUsersStore()
  const { menuTree, hasMenuPermission, getRoleById } = usePermissionsStore()
  const [collapsed, setCollapsed] = useState(false)
  const [checking, setChecking] = useState(true)

  const currentUser = getUserByUsername(user?.username || '')
  const userRoleId = user?.role || 'user'
  const userRole = getRoleById(userRoleId)

  useEffect(() => {
    checkAuth().finally(() => setChecking(false))
  }, [checkAuth])

  useEffect(() => {
    if (!checking && !loading && isAuthenticated && user) {
      const menuKey = pathToMenuKey(location.pathname)
      if (menuKey && !hasMenuPermission(userRoleId, menuKey)) {
        navigate({ to: '/403' })
      }
    }
  }, [checking, loading, isAuthenticated, user, location.pathname, userRoleId, hasMenuPermission, navigate])

  const buildMenuItems = (menus: typeof menuTree): any[] => {
    return menus
      .filter(menu => hasMenuPermission(userRoleId, menu.key))
      .map(menu => {
        const children = menu.children ? buildMenuItems(menu.children) : undefined
        return {
          key: menu.path,
          icon: menu.icon ? iconMap[menu.icon] : undefined,
          label: menu.label,
          children: children && children.length > 0 ? children : undefined,
          onClick: () => navigate({ to: menu.path })
        }
      })
      .filter(item => !item.children || item.children.length > 0)
  }

  const menuItems = buildMenuItems(menuTree)

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/login', search: { redirect: undefined } })
  }

  if (checking || loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Layout className="auth-layout">
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div className="logo">{collapsed ? '后台' : '后台管理系统'}</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header className="auth-header">
          <div className="header-left">
            {collapsed ? (
              <MenuUnfoldOutlined className="trigger" onClick={() => setCollapsed(false)} />
            ) : (
              <MenuFoldOutlined className="trigger" onClick={() => setCollapsed(true)} />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {userRole && (
              <Tag color={userRole.isSystem ? 'gold' : 'blue'}>
                角色: {userRole.name}
              </Tag>
            )}
            <Dropdown
              menu={{
                items: [
                  { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }
                ]
              }}
            >
              <div className="user-info">
                <Avatar src={currentUser?.avatar || user?.avatar} />
                <span className="username">{currentUser?.nickname || user?.nickname}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="auth-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    const token = useAuthStore.getState().token
    if (!token) {
      throw redirect({ to: '/login', search: { redirect: window.location.pathname } })
    }
  },
  component: AuthLayout
})
