import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Divider, message, Alert } from 'antd'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { usePermissionsStore } from '@/stores/permissions'

function SettingsPage() {
  const { user } = useAuthStore()
  const { getUserByUsername, updateUser } = useUsersStore()
  const { hasButtonPermission, getRoleById } = usePermissionsStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const currentUser = getUserByUsername(user?.username || '')
  const userRoleId = user?.role || 'user'
  const userRole = getRoleById(userRoleId)
  const canEdit = hasButtonPermission(userRoleId, 'settings:edit')

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({ nickname: currentUser.nickname, email: currentUser.email })
    }
  }, [currentUser, form])

  const handleSave = async () => {
    if (!canEdit) {
      message.warning('您没有修改设置的权限')
      return
    }
    const values = await form.validateFields()
    if (!currentUser) return

    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))

    updateUser(currentUser.id, { email: values.email, nickname: values.nickname })
    message.success('设置已保存')
    setLoading(false)
  }

  return (
    <div>
      <h2 className="page-title">系统设置</h2>
      <Card hoverable>
        <h3 style={{ marginBottom: 24, fontSize: 16 }}>个人信息</h3>
        {!canEdit && (
          <Alert
            message="您只有查看权限，无法修改个人信息"
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}
        <Form form={form} layout="horizontal" labelCol={{ span: 4 }} wrapperCol={{ span: 10 }}>
          <Form.Item label="用户名">
            <Input value={currentUser?.username} disabled />
          </Form.Item>
          <Form.Item name="nickname" label="昵称">
            <Input disabled={!canEdit} placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input disabled={!canEdit} placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item label="角色">
            <Input value={userRole?.name || currentUser?.role} disabled />
          </Form.Item>
          <Divider />
          <Form.Item wrapperCol={{ offset: 4 }}>
            <Button type="primary" loading={loading} onClick={handleSave} disabled={!canEdit}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/_auth/settings')({
  component: SettingsPage
})
