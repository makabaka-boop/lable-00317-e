import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import {
  Layout, Card, List, Button, Modal, Form, Input,
  Tag, Space, Divider, Empty, message, Tree, Typography, Tooltip,
  Popconfirm, Row, Col, Badge, Select, Alert
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined,
  SafetyCertificateOutlined, ReloadOutlined,
  CheckCircleOutlined, CloseCircleOutlined, SwapOutlined
} from '@ant-design/icons'
import { usePermissionsStore, findMenuByKey } from '@/stores/permissions'
import { useAuthStore } from '@/stores/auth'
import type { DataNode } from 'antd/es/tree'
import type { Role as RoleType, MenuItemPermission } from '@/types'
import type { ButtonPermission } from '@/types'

const { Sider, Content } = Layout
const { Text } = Typography

interface TreeDataNode extends DataNode {
  key: string
  title: React.ReactNode
  children?: TreeDataNode[]
  menuKey?: string
  buttonKey?: string
}

function buildTreeData(
  menus: MenuItemPermission[],
  checkedMenus: Set<string>,
  checkedButtons: Set<string>,
  compareMenus?: Set<string>,
  compareButtons?: Set<string>
): TreeDataNode[] {
  return menus.map(menu => {
    const menuChecked = checkedMenus.has(menu.key)
    const menuInCompare = compareMenus?.has(menu.key)
    const menuDiff = compareMenus ? (
      menuChecked && !menuInCompare ? 'added' :
      !menuChecked && menuInCompare ? 'removed' : null
    ) : null

    const buttonNodes: TreeDataNode[] = (menu.buttons || []).map((button: ButtonPermission) => {
      const btnChecked = checkedButtons.has(button.key)
      const btnInCompare = compareButtons?.has(button.key)
      const btnDiff = compareButtons ? (
        btnChecked && !btnInCompare ? 'added' :
        !btnChecked && btnInCompare ? 'removed' : null
      ) : null

      return {
        key: `btn:${button.key}`,
        title: (
          <Space>
            <Text style={{ fontSize: 12, color: '#666' }}>{button.label}</Text>
            {btnDiff === 'added' && <Badge status="success" size="small" />}
            {btnDiff === 'removed' && <Badge status="error" size="small" />}
          </Space>
        ),
        buttonKey: button.key,
        disableCheckbox: false
      }
    })

    const childNodes = menu.children ? buildTreeData(menu.children, checkedMenus, checkedButtons, compareMenus, compareButtons) : []

    return {
      key: `menu:${menu.key}`,
      title: (
        <Space>
          <Text strong>{menu.label}</Text>
          {menuDiff === 'added' && <Tag color="green" style={{ margin: 0 }}>新增</Tag>}
          {menuDiff === 'removed' && <Tag color="red" style={{ margin: 0 }}>移除</Tag>}
        </Space>
      ),
      menuKey: menu.key,
      children: [...buttonNodes, ...childNodes],
      disableCheckbox: false
    }
  })
}

function RolesPage() {
  const {
    roles, menuTree, currentRoleId, compareRoleId,
    setCurrentRole, setCompareRole, getRoleById,
    createRole, updateRole, deleteRole, copyRole,
    updateRolePermissions, calculateDiff, resetToDefaults
  } = usePermissionsStore()

  const { user } = useAuthStore()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleType | null>(null)
  const [copySourceRole, setCopySourceRole] = useState<RoleType | null>(null)
  const [form] = Form.useForm()
  const [copyForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const currentRole = useMemo(() => getRoleById(currentRoleId || ''), [currentRoleId, getRoleById, roles])
  const compareRole = useMemo(() => getRoleById(compareRoleId || ''), [compareRoleId, getRoleById, roles])

  const checkedKeys = useMemo(() => {
    if (!currentRole) return { checked: [], halfChecked: [] }
    const menuKeys = currentRole.menuPermissions.map(k => `menu:${k}`)
    const buttonKeys = currentRole.buttonPermissions.map(k => `btn:${k}`)
    return { checked: [...menuKeys, ...buttonKeys], halfChecked: [] }
  }, [currentRole])

  const compareMenus = useMemo(() => new Set(compareRole?.menuPermissions || []), [compareRole])
  const compareButtons = useMemo(() => new Set(compareRole?.buttonPermissions || []), [compareRole])

  const treeData = useMemo(() => {
    if (!currentRole) return []
    return buildTreeData(
      menuTree,
      new Set(currentRole.menuPermissions),
      new Set(currentRole.buttonPermissions),
      compareRole ? compareMenus : undefined,
      compareRole ? compareButtons : undefined
    )
  }, [currentRole, menuTree, compareRole, compareMenus, compareButtons])

  const diff = useMemo(() => {
    if (!currentRole || !compareRole) return null
    return calculateDiff(currentRole.id, compareRole.id)
  }, [currentRole, compareRole, calculateDiff])

  useEffect(() => {
    if (roles.length > 0 && !currentRoleId) {
      setCurrentRole(roles[0].id)
    }
  }, [roles, currentRoleId, setCurrentRole])

  const handleCheck = (checked: any) => {
    if (!currentRole) return

    const checkedArray = Array.isArray(checked) ? checked : checked.checked
    const newMenuPermissions: string[] = []
    const newButtonPermissions: string[] = []

    checkedArray.forEach((key: string) => {
      if (key.startsWith('menu:')) {
        newMenuPermissions.push(key.replace('menu:', ''))
      } else if (key.startsWith('btn:')) {
        newButtonPermissions.push(key.replace('btn:', ''))
      }
    })

    const autoIncludeButtons = newMenuPermissions.map(menuKey => {
      const menu = findMenuByKey(menuTree, menuKey)
      return menu?.buttons?.map(b => b.key) || []
    }).flat()

    const finalButtonPermissions = [...new Set([...newButtonPermissions, ...autoIncludeButtons])]

    updateRolePermissions(currentRole.id, newMenuPermissions, finalButtonPermissions)
  }

  const handleCreateRole = async () => {
    try {
      const values = await form.validateFields()
      createRole({ name: values.name, description: values.description })
      message.success('角色创建成功')
      setCreateModalOpen(false)
      form.resetFields()
    } catch {
      // validation error
    }
  }

  const handleEditRole = async () => {
    if (!editingRole) return
    try {
      const values = await editForm.validateFields()
      updateRole(editingRole.id, { name: values.name, description: values.description })
      message.success('角色更新成功')
      setEditModalOpen(false)
      setEditingRole(null)
      editForm.resetFields()
    } catch {
      // validation error
    }
  }

  const handleCopyRole = async () => {
    if (!copySourceRole) return
    try {
      const values = await copyForm.validateFields()
      copyRole(copySourceRole.id, values.name, values.description)
      message.success('角色复制成功')
      setCopyModalOpen(false)
      setCopySourceRole(null)
      copyForm.resetFields()
    } catch {
      // validation error
    }
  }

  const handleDeleteRole = (role: RoleType) => {
    if (role.isSystem) {
      message.warning('系统角色不可删除')
      return
    }
    deleteRole(role.id)
    message.success('角色删除成功')
  }

  const isCurrentUserRole = currentRole?.id === user?.role

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="page-title" style={{ margin: 0 }}>角色权限配置中心</h2>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '确认重置',
                content: '这将重置所有角色配置为默认值，确定继续吗？',
                onOk: () => {
                  resetToDefaults()
                  message.success('已重置为默认配置')
                }
              })
            }}
          >
            重置默认
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            新增角色
          </Button>
        </Space>
      </div>

      <Layout style={{ background: 'transparent', minHeight: 600 }}>
        <Sider
          width={280}
          style={{ background: 'transparent', paddingRight: 16 }}
          theme="light"
        >
          <Card
            title="角色列表"
            size="small"
            style={{ height: '100%' }}
            styles={{ body: { padding: 0, height: 'calc(100% - 48px)', overflow: 'auto' } }}
          >
            <List
              dataSource={roles}
              renderItem={(role) => (
                <List.Item
                  key={role.id}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: currentRoleId === role.id ? '#e6f4ff' : 'transparent',
                    borderLeft: currentRoleId === role.id ? '3px solid #1677ff' : '3px solid transparent'
                  }}
                  onClick={() => setCurrentRole(role.id)}
                  actions={[
                    <Tooltip key="edit" title="编辑">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        disabled={role.isSystem}
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingRole(role)
                          editForm.setFieldsValue({ name: role.name, description: role.description })
                          setEditModalOpen(true)
                        }}
                      />
                    </Tooltip>,
                    <Tooltip key="copy" title="复制权限">
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCopySourceRole(role)
                          copyForm.setFieldsValue({ name: `${role.name} 副本`, description: '' })
                          setCopyModalOpen(true)
                        }}
                      />
                    </Tooltip>,
                    <Popconfirm
                      key="delete"
                      title="确认删除此角色？"
                      disabled={role.isSystem}
                      onConfirm={(e) => {
                        e?.stopPropagation()
                        handleDeleteRole(role)
                      }}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={role.isSystem}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<SafetyCertificateOutlined style={{ fontSize: 20, color: role.isSystem ? '#faad14' : '#1677ff' }} />}
                    title={
                      <Space>
                        <Text strong>{role.name}</Text>
                        {role.isSystem && <Tag color="gold">系统</Tag>}
                        {isCurrentUserRole && <Tag color="blue">当前</Tag>}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0} style={{ width: '100%' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>{role.description || '暂无描述'}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {role.menuPermissions.length} 个菜单 · {role.buttonPermissions.length} 个按钮权限
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Sider>

        <Content style={{ background: 'transparent', padding: '0 16px' }}>
          <Card
            title={
              <Space>
                <span>权限配置</span>
                {currentRole && (
                  <Tag color="blue">{currentRole.name}</Tag>
                )}
              </Space>
            }
            size="small"
            style={{ height: '100%' }}
            styles={{ body: { height: 'calc(100% - 48px)', overflow: 'auto' } }}
            extra={
              <Select
                placeholder="选择对比角色"
                allowClear
                style={{ width: 160 }}
                value={compareRoleId}
                onChange={(value) => setCompareRole(value || null)}
                options={roles
                  .filter(r => r.id !== currentRoleId)
                  .map(r => ({ label: r.name, value: r.id }))}
              />
            }
          >
            {currentRole ? (
              <>
                {compareRole && (
                  <Alert
                    message={
                      <Space>
                        <SwapOutlined />
                        <span>正在与 <strong>{compareRole.name}</strong> 对比</span>
                        <Tag color="green">
                          <CheckCircleOutlined /> 新增 {(diff?.addedMenus?.length || 0) + (diff?.addedButtons?.length || 0)} 项
                        </Tag>
                        <Tag color="red">
                          <CloseCircleOutlined /> 移除 {(diff?.removedMenus?.length || 0) + (diff?.removedButtons?.length || 0)} 项
                        </Tag>
                      </Space>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}
                <Tree
                  checkable
                  checkedKeys={checkedKeys}
                  onCheck={handleCheck}
                  treeData={treeData}
                  defaultExpandAll
                  selectable={false}
                />
              </>
            ) : (
              <Empty description="请选择一个角色进行配置" style={{ marginTop: 100 }} />
            )}
          </Card>
        </Content>

        <Sider
          width={320}
          style={{ background: 'transparent', paddingLeft: 16 }}
          theme="light"
        >
          <Card
            title="权限预览"
            size="small"
            style={{ height: '100%' }}
            styles={{ body: { height: 'calc(100% - 48px)', overflow: 'auto' } }}
          >
            {currentRole ? (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div>
                  <Text strong>角色信息</Text>
                  <Divider style={{ margin: '8px 0' }} />
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Row>
                      <Col span={8}><Text type="secondary">名称:</Text></Col>
                      <Col span={16}>{currentRole.name}</Col>
                    </Row>
                    <Row>
                      <Col span={8}><Text type="secondary">描述:</Text></Col>
                      <Col span={16}>{currentRole.description || '-'}</Col>
                    </Row>
                    <Row>
                      <Col span={8}><Text type="secondary">类型:</Text></Col>
                      <Col span={16}>
                        {currentRole.isSystem ? <Tag color="gold">系统角色</Tag> : <Tag color="blue">自定义角色</Tag>}
                      </Col>
                    </Row>
                    <Row>
                      <Col span={8}><Text type="secondary">创建时间:</Text></Col>
                      <Col span={16}><Text style={{ fontSize: 12 }}>{currentRole.createdAt}</Text></Col>
                    </Row>
                    <Row>
                      <Col span={8}><Text type="secondary">更新时间:</Text></Col>
                      <Col span={16}><Text style={{ fontSize: 12 }}>{currentRole.updatedAt}</Text></Col>
                    </Row>
                  </Space>
                </div>

                <div>
                  <Text strong>已授权菜单</Text>
                  <Divider style={{ margin: '8px 0' }} />
                  <Space wrap>
                    {currentRole.menuPermissions.length > 0 ? (
                      currentRole.menuPermissions.map(key => {
                        const menu = findMenuByKey(menuTree, key)
                        return menu ? (
                          <Tag key={key} color="blue">{menu.label}</Tag>
                        ) : null
                      })
                    ) : (
                      <Text type="secondary">无</Text>
                    )}
                  </Space>
                </div>

                <div>
                  <Text strong>已授权按钮</Text>
                  <Divider style={{ margin: '8px 0' }} />
                  <Space wrap>
                    {currentRole.buttonPermissions.length > 0 ? (
                      currentRole.buttonPermissions.map(key => (
                        <Tag key={key} color="green">{key}</Tag>
                      ))
                    ) : (
                      <Text type="secondary">无</Text>
                    )}
                  </Space>
                </div>

                {compareRole && diff && (
                  <div>
                    <Text strong>权限差异对比</Text>
                    <Divider style={{ margin: '8px 0' }} />
                    {(diff.addedMenus.length + diff.addedButtons.length > 0) && (
                      <div style={{ marginBottom: 8 }}>
                        <Text type="success" style={{ fontSize: 12 }}>
                          <CheckCircleOutlined /> 相比 {compareRole.name} 新增:
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Space wrap>
                            {[...diff.addedMenus, ...diff.addedButtons].map(key => (
                              <Tag key={key} color="green">{key}</Tag>
                            ))}
                          </Space>
                        </div>
                      </div>
                    )}
                    {(diff.removedMenus.length + diff.removedButtons.length > 0) && (
                      <div>
                        <Text type="danger" style={{ fontSize: 12 }}>
                          <CloseCircleOutlined /> 相比 {compareRole.name} 移除:
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Space wrap>
                            {[...diff.removedMenus, ...diff.removedButtons].map(key => (
                              <Tag key={key} color="red">{key}</Tag>
                            ))}
                          </Space>
                        </div>
                      </div>
                    )}
                    {diff.addedMenus.length + diff.addedButtons.length + diff.removedMenus.length + diff.removedButtons.length === 0 && (
                      <Text type="secondary">权限完全相同</Text>
                    )}
                  </div>
                )}
              </Space>
            ) : (
              <Empty description="选择角色查看详情" style={{ marginTop: 100 }} />
            )}
          </Card>
        </Sider>
      </Layout>

      <Modal
        title="新增角色"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false)
          form.resetFields()
        }}
        onOk={handleCreateRole}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item name="description" label="角色描述">
            <Input.TextArea placeholder="请输入角色描述" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑角色"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false)
          setEditingRole(null)
          editForm.resetFields()
        }}
        onOk={handleEditRole}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item name="description" label="角色描述">
            <Input.TextArea placeholder="请输入角色描述" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="复制角色权限"
        open={copyModalOpen}
        onCancel={() => {
          setCopyModalOpen(false)
          setCopySourceRole(null)
          copyForm.resetFields()
        }}
        onOk={handleCopyRole}
        okText="复制"
        cancelText="取消"
      >
        {copySourceRole && (
          <Alert
            message={`将从 "${copySourceRole.name}" 复制所有权限配置`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={copyForm} layout="vertical">
          <Form.Item
            name="name"
            label="新角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item name="description" label="角色描述">
            <Input.TextArea placeholder="请输入角色描述" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export const Route = createFileRoute('/_auth/roles')({
  component: RolesPage
})
