import { createFileRoute, Outlet, redirect, useNavigate, useLocation, Navigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Layout, Menu, Dropdown, Avatar, Spin, Tag } from 'antd'
import {
  HomeOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { usePermissionsStore } from '@/stores/permissions'
import './auth.scss'

const { Sider, Header, Content } = Layout

interface MenuItem {
  key: string
  icon: React.ReactNode
  label: string
  permissionKey: string
}

const allMenuItems: MenuItem[] = [
  { key: '/dashboard', icon: <HomeOutlined />, label: '仪表盘', permissionKey: '/dashboard' },
  { key: '/users', icon: <UserOutlined />, label: '用户管理', permissionKey: '/users' },
  { key: '/roles', icon: <TeamOutlined />, label: '角色权限', permissionKey: '/roles' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置', permissionKey: '/settings' }
]

function AuthLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, checkAuth, loading, isAuthenticated } = useAuthStore()
  const users = useUsersStore(state => state.users)
  const roles = usePermissionsStore(state => state.roles)
  const userRoleMap = usePermissionsStore(state => state.userRoleMap)
  
  const getUserByUsername = (username: string) => {
    return users.find(u => u.username === username)
  }
  const [collapsed, setCollapsed] = useState(false)
  const [checking, setChecking] = useState(true)

  const currentUser = getUserByUsername(user?.username || '')
  
  const userRoleId = user ? userRoleMap[user.username] : null
  const userRole = userRoleId ? roles.find(r => r.id === userRoleId) : null
  const userMenuPermissions = userRole?.menuPermissions || []

  useEffect(() => {
    checkAuth().finally(() => setChecking(false))
  }, [checkAuth])

  const menuItems = allMenuItems.filter(item =>
    userMenuPermissions.includes(item.permissionKey)
  )

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

  if (!isAuthenticated) {
    return <Navigate to="/login" search={{ redirect: window.location.pathname }} />
  }

  return (
    <Layout className="auth-layout">
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div className="logo">{collapsed ? '后台' : '后台管理系统'}</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            onClick: () => navigate({ to: item.key })
          }))}
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
          <div className="header-right">
            {userRole && (
              <Tag color="blue" className="role-tag">
                {userRole.name}
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
  beforeLoad: ({ location }) => {
    const token = useAuthStore.getState().token
    if (!token) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }

    const username = useAuthStore.getState().user?.username
    if (username) {
      const hasAccess = usePermissionsStore.getState().hasMenuPermission(username, location.pathname)
      if (!hasAccess) {
        const publicPaths = ['/login', '/dashboard']
        if (!publicPaths.includes(location.pathname)) {
          throw redirect({ to: '/403' })
        }
      }
    }
  },
  component: AuthLayout
})
