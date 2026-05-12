import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Layout,
  List,
  Button,
  Modal,
  Form,
  Input,
  Tree,
  Card,
  Tag,
  Space,
  Divider,
  message,
  Popconfirm,
  Tooltip,
  Checkbox
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  SaveOutlined,
  CloseOutlined,
  EyeOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined
} from '@ant-design/icons'
import { usePermissionsStore, menuTreeData } from '@/stores/permissions'
import { useAuthStore } from '@/stores/auth'
import type { MenuPermission } from '@/types'
import '../roles.scss'

const { Sider, Content } = Layout
const { TextArea } = Input

interface TreeDataNode {
  key: string
  title: string
  children?: TreeDataNode[]
}

const convertToTreeData = (menus: MenuPermission[]): TreeDataNode[] => {
  return menus.map(menu => ({
    key: menu.key,
    title: menu.title,
    children: menu.children ? convertToTreeData(menu.children) : undefined
  }))
}

const getAllActionOptions = (menus: MenuPermission[]): { key: string; label: string; menuKey: string }[] => {
  const options: { key: string; label: string; menuKey: string }[] = []
  menus.forEach(menu => {
    if (menu.actions) {
      menu.actions.forEach(action => {
        options.push({
          key: `${menu.key}:${action}`,
          label: `${menu.title} - ${action}`,
          menuKey: menu.key
        })
      })
    }
    if (menu.children) {
      options.push(...getAllActionOptions(menu.children))
    }
  })
  return options
}

const treeData = convertToTreeData(menuTreeData)
const actionOptions = getAllActionOptions(menuTreeData)

function RolesPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    roles,
    selectedRoleId,
    editingRole,
    tempMenuPermissions,
    tempActionPermissions,
    setSelectedRoleId,
    setEditingRole,
    setTempMenuPermissions,
    setTempActionPermissions,
    addRole,
    updateRole,
    deleteRole,
    copyRole,
    saveRolePermissions,
    getPermissionDiff
  } = usePermissionsStore()

  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'add' | 'edit' | 'copy'>('add')
  const [form] = Form.useForm()
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['/settings'])

  const selectedRole = roles.find(r => r.id === selectedRoleId)
  const permissionDiff = selectedRoleId ? getPermissionDiff(selectedRoleId) : { added: [], removed: [] }

  useEffect(() => {
    if (selectedRole) {
      setTempMenuPermissions(selectedRole.menuPermissions)
      setTempActionPermissions(selectedRole.actionPermissions)
    } else {
      setTempMenuPermissions([])
      setTempActionPermissions([])
    }
  }, [selectedRoleId, selectedRole])

  const handleSelectRole = (roleId: string) => {
    setSelectedRoleId(roleId)
    setEditingRole(null)
  }

  const handleAddRole = () => {
    setModalType('add')
    form.resetFields()
    setModalVisible(true)
  }

  const handleEditRole = () => {
    if (!selectedRole) return
    setModalType('edit')
    form.setFieldsValue({
      name: selectedRole.name,
      code: selectedRole.code,
      description: selectedRole.description
    })
    setModalVisible(true)
  }

  const handleCopyRole = () => {
    if (!selectedRole) return
    setModalType('copy')
    form.setFieldsValue({
      name: `${selectedRole.name} 副本`,
      code: `${selectedRole.code}_copy`,
      description: selectedRole.description
    })
    setModalVisible(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (modalType === 'add') {
        addRole({
          ...values,
          menuPermissions: [],
          actionPermissions: []
        })
        message.success('角色创建成功')
      } else if (modalType === 'edit' && selectedRole) {
        updateRole(selectedRole.id, values)
        message.success('角色更新成功')
      } else if (modalType === 'copy' && selectedRole) {
        copyRole(selectedRole.id, values.name, values.code)
        message.success('角色复制成功')
      }
      setModalVisible(false)
    } catch {
      // validation error
    }
  }

  const handleDeleteRole = () => {
    if (!selectedRole) return
    if (selectedRole.code === 'admin') {
      message.error('超级管理员角色不可删除')
      return
    }
    deleteRole(selectedRole.id)
    message.success('角色删除成功')
  }

  const handleStartEdit = () => {
    if (!selectedRole) return
    setEditingRole(selectedRole)
  }

  const handleCancelEdit = () => {
    setEditingRole(null)
    if (selectedRole) {
      setTempMenuPermissions(selectedRole.menuPermissions)
      setTempActionPermissions(selectedRole.actionPermissions)
    }
  }

  const handleSavePermissions = () => {
    if (!selectedRole) return
    saveRolePermissions(selectedRole.id)
    message.success('权限保存成功')
  }

  const handleMenuCheck = (checkedKeys: { checked: string[]; halfChecked: string[] }) => {
    setTempMenuPermissions(checkedKeys.checked)
  }

  const handleActionCheck = (actionKey: string, checked: boolean) => {
    if (checked) {
      setTempActionPermissions([...tempActionPermissions, actionKey])
    } else {
      setTempActionPermissions(tempActionPermissions.filter(k => k !== actionKey))
    }
  }

  const filteredActionOptions = actionOptions.filter(opt =>
    (tempMenuPermissions || []).includes(opt.menuKey)
  )

  return (
    <Layout className="roles-layout">
      <Sider width={280} className="roles-sider">
        <div className="sider-header">
          <h3>角色列表</h3>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddRole}>
            新增
          </Button>
        </div>
        <List
          className="roles-list"
          dataSource={roles}
          renderItem={role => (
            <List.Item
              key={role.id}
              className={`role-item ${selectedRoleId === role.id ? 'selected' : ''}`}
              onClick={() => handleSelectRole(role.id)}
            >
              <div className="role-info">
                <div className="role-name">
                  {role.name}
                  {role.code === 'admin' && <Tag color="gold" size="small">系统</Tag>}
                </div>
                <div className="role-code">{role.code}</div>
                <div className="role-desc">{role.description}</div>
              </div>
            </List.Item>
          )}
        />
      </Sider>

      <Layout className="roles-main">
        <Sider width={400} className="menu-sider">
          <div className="sider-header">
            <h3>菜单权限配置</h3>
            {selectedRole && (
              <Space>
                {editingRole ? (
                  <>
                    <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSavePermissions}>
                      保存
                    </Button>
                    <Button size="small" icon={<CloseOutlined />} onClick={handleCancelEdit}>
                      取消
                    </Button>
                  </>
                ) : (
                  <Button size="small" type="primary" icon={<EditOutlined />} onClick={handleStartEdit}>
                    编辑权限
                  </Button>
                )}
              </Space>
            )}
          </div>

          {selectedRole ? (
            <div className="menu-config">
              <div className="config-section">
                <h4>菜单权限</h4>
                <Tree
                  checkable
                  checkedKeys={tempMenuPermissions}
                  expandedKeys={expandedKeys}
                  onExpand={setExpandedKeys}
                  onCheck={handleMenuCheck as any}
                  treeData={treeData}
                  disabled={!editingRole}
                />
              </div>

              <Divider />

              <div className="config-section">
                <h4>按钮操作权限</h4>
                <div className="action-list">
                  {filteredActionOptions.length === 0 ? (
                    <div className="empty-tip">请先选择菜单</div>
                  ) : (
                    filteredActionOptions.map(opt => (
                      <div key={opt.key} className="action-item">
                        <Checkbox
                          checked={tempActionPermissions.includes(opt.key)}
                          onChange={e => handleActionCheck(opt.key, e.target.checked)}
                          disabled={!editingRole}
                        >
                          {opt.label}
                        </Checkbox>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">请选择一个角色</div>
          )}
        </Sider>

        <Content className="roles-content">
          {selectedRole ? (
            <div className="preview-panel">
              <div className="panel-header">
                <div>
                  <h3>{selectedRole.name}</h3>
                  <Tag color="blue">{selectedRole.code}</Tag>
                </div>
                <Space>
                  <Tooltip title="编辑角色">
                    <Button icon={<EditOutlined />} size="small" onClick={handleEditRole} />
                  </Tooltip>
                  <Tooltip title="复制角色">
                    <Button icon={<CopyOutlined />} size="small" onClick={handleCopyRole} />
                  </Tooltip>
                  <Popconfirm
                    title="确定删除此角色？"
                    onConfirm={handleDeleteRole}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Tooltip title="删除角色">
                      <Button icon={<DeleteOutlined />} size="small" danger disabled={selectedRole.code === 'admin'} />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              </div>

              <Card title="角色信息" size="small">
                <div className="info-row">
                  <span className="label">角色编码：</span>
                  <span>{selectedRole.code}</span>
                </div>
                <div className="info-row">
                  <span className="label">描述：</span>
                  <span>{selectedRole.description}</span>
                </div>
                <div className="info-row">
                  <span className="label">创建时间：</span>
                  <span>{selectedRole.createdAt}</span>
                </div>
                <div className="info-row">
                  <span className="label">更新时间：</span>
                  <span>{selectedRole.updatedAt}</span>
                </div>
              </Card>

              {editingRole && (permissionDiff.added.length > 0 || permissionDiff.removed.length > 0) && (
                <Card title="权限变更预览" size="small" className="diff-card">
                  {permissionDiff.added.length > 0 && (
                    <div className="diff-section">
                      <div className="diff-title">
                        <PlusCircleOutlined style={{ color: '#52c41a' }} /> 新增权限
                      </div>
                      <div className="diff-items">
                        {permissionDiff.added.map(key => (
                          <Tag key={key} color="success">{key}</Tag>
                        ))}
                      </div>
                    </div>
                  )}
                  {permissionDiff.removed.length > 0 && (
                    <div className="diff-section">
                      <div className="diff-title">
                        <MinusCircleOutlined style={{ color: '#ff4d4f' }} /> 移除权限
                      </div>
                      <div className="diff-items">
                        {permissionDiff.removed.map(key => (
                          <Tag key={key} color="error">{key}</Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              <Card title="当前权限预览" size="small">
                <div className="permission-preview">
                  <h4>
                    <EyeOutlined /> 可访问菜单 ({tempMenuPermissions.length})
                  </h4>
                  <div className="menu-preview">
                    {tempMenuPermissions.length === 0 ? (
                      <div className="empty-tip">暂无权限</div>
                    ) : (
                      tempMenuPermissions.map(key => (
                        <Tag key={key} color="blue">{key}</Tag>
                      ))
                    )}
                  </div>

                  <Divider />

                  <h4>
                    <EyeOutlined /> 可执行操作 ({tempActionPermissions.length})
                  </h4>
                  <div className="action-preview">
                    {tempActionPermissions.length === 0 ? (
                      <div className="empty-tip">暂无权限</div>
                    ) : (
                      tempActionPermissions.map(key => (
                        <Tag key={key} color="green">{key}</Tag>
                      ))
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <h3>请从左侧选择一个角色</h3>
              <p>或点击"新增"按钮创建新角色</p>
            </div>
          )}
        </Content>
      </Layout>

      <Modal
        title={modalType === 'add' ? '新增角色' : modalType === 'edit' ? '编辑角色' : '复制角色'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="角色编码"
            rules={[{ required: true, message: '请输入角色编码' }]}
          >
            <Input placeholder="请输入角色编码" disabled={modalType === 'edit'} />
          </Form.Item>
          <Form.Item name="description" label="角色描述">
            <TextArea rows={3} placeholder="请输入角色描述" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}

export const Route = createFileRoute('/_auth/roles')({
  component: RolesPage
})
