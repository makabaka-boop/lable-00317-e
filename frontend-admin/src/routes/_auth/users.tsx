import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Card, Table, Tag, Avatar, Button, Modal, Form, Input, Select, message } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useUsersStore, type UserItem } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'

function UsersPage() {
  const { users, updateUser } = useUsersStore()
  const { roles, getRoleName, getButtonKeysForUserRole } = usePermissionStore()
  const { user: currentUser } = useAuthStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const buttonKeys = useMemo(() => {
    if (!currentUser) return [] as string[]
    return getButtonKeysForUserRole(currentUser.role, '/users')
  }, [currentUser, getButtonKeysForUserRole])

  const canEdit = buttonKeys.includes('users:edit')
  const canDelete = buttonKeys.includes('users:delete')

  const roleOptions = useMemo(
    () => roles.map((r) => ({ label: r.name, value: r.id })),
    [roles]
  )

  const handleEdit = (record: UserItem) => {
    if (record.username === 'admin') {
      message.warning('管理员账户不可编辑')
      return
    }
    setEditingUser(record)
    form.setFieldsValue({ nickname: record.nickname, email: record.email, role: record.role })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    updateUser(editingUser!.id, values)
    message.success('保存成功')
    setModalOpen(false)
    setLoading(false)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: '用户',
      key: 'user',
      render: (_: unknown, record: UserItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} src={record.avatar} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.nickname}</div>
            <div style={{ fontSize: 12, color: '#909399' }}>{record.username}</div>
          </div>
        </div>
      )
    },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color={role === 'role_admin' || role === 'admin' ? 'red' : 'blue'}>{getRoleName(role)}</Tag>
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: UserItem) => (
        <>
          {canEdit && (
            <Button
              type="link"
              icon={<EditOutlined />}
              disabled={record.username === 'admin'}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {canDelete && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={record.username === 'admin'}
            >
              删除
            </Button>
          )}
        </>
      )
    }
  ]

  return (
    <div>
      <h2 className="page-title">用户管理</h2>
      <Card hoverable>
        <Table dataSource={users} columns={columns} rowKey="id" />
      </Card>
      <Modal title="编辑用户" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleSubmit} confirmLoading={loading}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="用户名">
            <Input value={editingUser?.username} disabled />
          </Form.Item>
          <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入正确的邮箱格式' }]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select options={roleOptions} placeholder="请选择角色" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export const Route = createFileRoute('/_auth/users')({
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (user) {
      const { isRouteAccessible } = usePermissionStore.getState()
      if (!isRouteAccessible(user.role, '/users')) {
        throw redirect({ to: '/403' })
      }
    }
  },
  component: UsersPage
})
