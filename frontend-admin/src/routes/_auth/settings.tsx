import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Divider, message } from 'antd'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'

function SettingsPage() {
  const { user } = useAuthStore()
  const { getUserByUsername, updateUser } = useUsersStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const currentUser = getUserByUsername(user?.username || '')
  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({ nickname: currentUser.nickname, email: currentUser.email })
    }
  }, [currentUser, form])

  const handleSave = async () => {
    const values = await form.validateFields()
    if (!currentUser) return

    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))

    const updateData: { email: string; nickname?: string } = { email: values.email }
    if (!isAdmin) {
      updateData.nickname = values.nickname
    }

    updateUser(currentUser.id, updateData)
    message.success('设置已保存')
    setLoading(false)
  }

  return (
    <div>
      <h2 className="page-title">系统设置</h2>
      <Card hoverable>
        <h3 style={{ marginBottom: 24, fontSize: 16 }}>个人信息</h3>
        <Form form={form} layout="horizontal" labelCol={{ span: 4 }} wrapperCol={{ span: 10 }}>
          <Form.Item label="用户名">
            <Input value={currentUser?.username} disabled />
          </Form.Item>
          <Form.Item name="nickname" label="昵称">
            <Input disabled={isAdmin} placeholder={isAdmin ? '' : '请输入昵称'} />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item label="角色">
            <Input value={currentUser?.role === 'admin' ? '管理员' : '普通用户'} disabled />
          </Form.Item>
          <Divider />
          <Form.Item wrapperCol={{ offset: 4 }}>
            <Button type="primary" loading={loading} onClick={handleSave}>
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
