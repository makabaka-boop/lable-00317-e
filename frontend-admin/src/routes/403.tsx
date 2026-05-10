import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from 'antd'
import { WarningOutlined } from '@ant-design/icons'

function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <div className="forbidden-container">
      <div className="forbidden-content">
        <WarningOutlined style={{ fontSize: 80, color: '#ff4d4f' }} />
        <h1>403</h1>
        <p>抱歉，您没有权限访问此页面</p>
        <Button type="primary" onClick={() => navigate({ to: '/dashboard' })}>
          返回首页
        </Button>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/403')({
  component: ForbiddenPage
})
