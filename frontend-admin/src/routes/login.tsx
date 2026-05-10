import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth'

// 自定义层叠图标组件
const StackIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
)

function LoginPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/login' })
  const { login, loading } = useAuthStore()

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      await login(values)
      message.success('登录成功')
      const redirect = (search as { redirect?: string }).redirect || '/dashboard'
      navigate({ to: redirect })
    } catch (error) {
      message.error((error as Error).message || '登录失败')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <StackIcon />
        </div>
        <div className="login-header">
          <h1>欢迎回来</h1>
          <p>登录您的管理账户</p>
        </div>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码长度不能少于6位' }]} style={{ marginBottom: 32 }}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div className="login-footer">
          © 2026 后台管理系统
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: search.redirect as string | undefined
  })
})
