import { createFileRoute } from '@tanstack/react-router'
import { Card, Row, Col, Statistic, Table, Tag } from 'antd'
import { UserOutlined, ShoppingCartOutlined, FileTextOutlined, LineChartOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'

const stats = [
  { title: '用户总数', value: 1234, icon: <UserOutlined />, color: '#1677ff' },
  { title: '订单数量', value: 567, icon: <ShoppingCartOutlined />, color: '#52c41a' },
  { title: '文档数量', value: 89, icon: <FileTextOutlined />, color: '#faad14' },
  { title: '访问量', value: 12345, icon: <LineChartOutlined />, color: '#ff4d4f' }
]

const recentOrders = [
  { id: 'ORD-001', customer: '王小明', amount: 299, status: 'completed', date: '2026-01-16 10:30' },
  { id: 'ORD-002', customer: '李华', amount: 1580, status: 'pending', date: '2026-01-16 09:15' },
  { id: 'ORD-003', customer: '张三', amount: 450, status: 'completed', date: '2026-01-15 18:20' },
  { id: 'ORD-004', customer: '赵六', amount: 2100, status: 'cancelled', date: '2026-01-15 14:45' },
  { id: 'ORD-005', customer: '陈七', amount: 680, status: 'pending', date: '2026-01-15 11:00' }
]

const statusMap: Record<string, { label: string; color: string }> = {
  completed: { label: '已完成', color: 'success' },
  pending: { label: '待处理', color: 'warning' },
  cancelled: { label: '已取消', color: 'error' }
}

const columns = [
  { title: '订单号', dataIndex: 'id', key: 'id' },
  { title: '客户', dataIndex: 'customer', key: 'customer' },
  { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => `¥${v.toFixed(2)}` },
  { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusMap[s].color}>{statusMap[s].label}</Tag> },
  { title: '时间', dataIndex: 'date', key: 'date' }
]

function DashboardPage() {
  const { user } = useAuthStore()
  const { getUserByUsername } = useUsersStore()
  const currentUser = getUserByUsername(user?.username || '')

  return (
    <div>
      <h2 className="page-title">欢迎回来，{currentUser?.nickname || user?.nickname}</h2>
      <Row gutter={[24, 24]}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card hoverable>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Statistic title={stat.title} value={stat.value} />
                <div style={{ width: 56, height: 56, borderRadius: 8, background: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#fff' }}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      <Card title="最近订单" style={{ marginTop: 24 }} hoverable>
        <Table dataSource={recentOrders} columns={columns} rowKey="id" pagination={false} />
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/_auth/dashboard')({
  component: DashboardPage
})
