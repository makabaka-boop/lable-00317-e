import { createFileRoute, Outlet, redirect, useNavigate, useLocation } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { Layout, Menu, Dropdown, Avatar, Spin } from 'antd'
import { HomeOutlined, UserOutlined, SettingOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SafetyOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { usePermissionStore, menuTree } from '@/stores/permission'
import './auth.scss'

const { Sider, Header, Content } = Layout

const iconComponentMap: Record<string, React.ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  UserOutlined: <UserOutlined />,
  SettingOutlined: <SettingOutlined />,
  SafetyOutlined: <SafetyOutlined />,
}

function AuthLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, checkAuth, loading } = useAuthStore()
  const { getUserByUsername } = useUsersStore()
  const { isMenuVisible, isRouteAccessible } = usePermissionStore()
  const [collapsed, setCollapsed] = useState(false)
  const [checking, setChecking] = useState(true)

  const currentUser = getUserByUsername(user?.username || '')

  useEffect(() => {
    checkAuth().finally(() => setChecking(false))
  }, [checkAuth])

  useEffect(() => {
    if (!user || checking) return
    const currentPath = location.pathname
    if (currentPath && currentPath !== '/' && currentPath !== '/login' && currentPath !== '/403') {
      if (!isRouteAccessible(user.role, currentPath)) {
        navigate({ to: '/403' })
      }
    }
  }, [user, location.pathname, checking, isRouteAccessible, navigate])

  const menuItems = useMemo(() => {
    if (!user) return []
    return menuTree
      .filter((node) => isMenuVisible(user.role, node.key))
      .map((node) => ({
        key: node.path || node.key,
        icon: node.icon ? iconComponentMap[node.icon] || null : null,
        label: node.label,
        menuKey: node.key,
      }))
  }, [user, isMenuVisible])

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
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            onClick: () => navigate({ to: item.key }),
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
