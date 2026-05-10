import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, Table, Tag, Avatar, Button, Modal, Form, Input, Select, message, Space, Tooltip } from 'antd'
import { EditOutlined, PlusOutlined, DeleteOutlined, ExportOutlined } from '@ant-design/icons'
import { useUsersStore, type UserItem } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore } from '@/stores/permissions'
import { useRolesStore } from '@/stores/roles'

function UsersPage() {
  const { users, updateUser } = useUsersStore()
  const { user } = useAuthStore()
  const { hasButtonPermission } = usePermissionsStore()
  const { roles } = useRolesStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const userRoleId = user?.role || 'user'

  const canEdit = hasButtonPermission(userRoleId, 'users:edit')
  const canCreate = hasButtonPermission(userRoleId, 'users:create')
  const canDelete = hasButtonPermission(userRoleId, 'users:delete')
  const canExport = hasButtonPermission(userRoleId, 'users:export')

  const roleOptions = roles.map(r => ({ label: r.name, value: r.id }))

  const handleEdit = (record: UserItem) => {
    if (record.username === 'admin') {
      message.warning('管理员账户不可编辑')
      return
    }
    if (!canEdit) {
      message.warning('您没有编辑用户的权限')
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
      render: (role: string) => {
        const roleInfo = roles.find(r => r.id === role)
        return (
          <Tag color={role === 'admin' ? 'red' : 'blue'}>
            {roleInfo?.name || role}
          </Tag>
        )
      }
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: UserItem) => (
        <Space>
          <Tooltip title={canEdit ? '' : '无权限'}>
            <Button
              type="link"
              icon={<EditOutlined />}
              disabled={record.username === 'admin' || !canEdit}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          </Tooltip>
          {canDelete && (
            <Tooltip title={canDelete ? '' : '无权限'}>
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                disabled={record.username === 'admin'}
                onClick={() => message.warning('删除功能需配合后端接口使用')}
              >
                删除
              </Button>
            </Tooltip>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="page-title" style={{ margin: 0 }}>用户管理</h2>
        <Space>
          {canExport && (
            <Button
              icon={<ExportOutlined />}
              onClick={() => message.success('导出功能需配合后端接口使用')}
            >
              导出
            </Button>
          )}
          {canCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => message.success('新增用户功能需配合后端接口使用')}
            >
              新增用户
            </Button>
          )}
        </Space>
      </div>
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
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select options={roleOptions} placeholder="请选择角色" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export const Route = createFileRoute('/_auth/users')({
  component: UsersPage
})
