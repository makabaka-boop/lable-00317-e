import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card,
  Tree,
  Button,
  Modal,
  Form,
  Input,
  List,
  Tag,
  Space,
  Popconfirm,
  message,
  Tooltip,
  Empty,
  Checkbox,
  Divider,
} from 'antd'
import {
  PlusOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  DiffOutlined,
  SafetyOutlined,
  HomeOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { usePermissionStore, menuTree, defaultButtons } from '@/stores/permission'
import { useAuthStore } from '@/stores/auth'
import type { RoleConfig, PermissionRoute, MenuTreeNode } from '@/types'
import './permission.scss'

const iconMap: Record<string, React.ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  UserOutlined: <UserOutlined />,
  SettingOutlined: <SettingOutlined />,
  SafetyOutlined: <SafetyOutlined />,
}

interface AntTreeNode {
  key: string
  title: string
  icon?: React.ReactNode
  children?: AntTreeNode[]
}

function buildAntTreeData(nodes: MenuTreeNode[]): AntTreeNode[] {
  return nodes.map((node) => ({
    key: node.key,
    title: node.label,
    icon: node.icon ? iconMap[node.icon] || null : undefined,
    children: node.children ? buildAntTreeData(node.children) : undefined,
  }))
}

function PermissionPage() {
  const {
    roles,
    selectedRoleId,
    addRole,
    updateRole,
    deleteRole,
    duplicateRole,
    selectRole,
  } = usePermissionStore()

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || null,
    [roles, selectedRoleId]
  )

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleConfig | null>(null)
  const [editForm] = Form.useForm()
  const [diffModalOpen, setDiffModalOpen] = useState(false)
  const [diffTargetRoleId, setDiffTargetRoleId] = useState<string | null>(null)

  const [checkedKeys, setCheckedKeys] = useState<string[]>([])
  const [routeButtonsMap, setRouteButtonsMap] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (selectedRole) {
      setCheckedKeys([...selectedRole.menuKeys])
      const map: Record<string, string[]> = {}
      selectedRole.routes.forEach((r) => {
        map[r.path] = r.buttons.map((b) => b.key)
      })
      setRouteButtonsMap(map)
    } else {
      setCheckedKeys([])
      setRouteButtonsMap({})
    }
  }, [selectedRole])

  const handleSave = useCallback(() => {
    if (!selectedRole) return
    const routes: PermissionRoute[] = checkedKeys
      .map((key) => {
        const node = menuTree.find((n) => n.key === key)
        if (!node?.path) return null
        const btnDefs = defaultButtons[node.path] || []
        const selectedBtnKeys = routeButtonsMap[node.path] || []
        const buttons = btnDefs.filter((b) => selectedBtnKeys.includes(b.key))
        return { path: node.path, label: node.label, buttons }
      })
      .filter(Boolean) as PermissionRoute[]

    updateRole(selectedRole.id, {
      menuKeys: [...checkedKeys],
      routes,
    })
    message.success('权限配置已保存')
  }, [selectedRole, checkedKeys, routeButtonsMap, updateRole])

  const handleAddRole = () => {
    setEditingRole(null)
    editForm.resetFields()
    setEditModalOpen(true)
  }

  const handleEditRole = (role: RoleConfig) => {
    setEditingRole(role)
    editForm.setFieldsValue({ name: role.name, description: role.description })
    setEditModalOpen(true)
  }

  const handleRoleSubmit = async () => {
    const values = await editForm.validateFields()
    if (editingRole) {
      updateRole(editingRole.id, { name: values.name, description: values.description })
      message.success('角色已更新')
    } else {
      addRole({
        name: values.name,
        description: values.description || '',
        menuKeys: [],
        routes: [],
      })
      message.success('角色已创建')
    }
    setEditModalOpen(false)
  }

  const handleCheck = (checked: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] }) => {
    const keys = Array.isArray(checked) ? checked : checked.checked
    setCheckedKeys(keys as string[])
    const newMap: Record<string, string[]> = {}
    ;(keys as string[]).forEach((key) => {
      const node = menuTree.find((n) => n.key === key)
      if (node?.path) {
        newMap[node.path] = routeButtonsMap[node.path] || defaultButtons[node.path]?.map((b) => b.key) || []
      }
    })
    setRouteButtonsMap(newMap)
  }

  const toggleButton = (path: string, btnKey: string) => {
    setRouteButtonsMap((prev) => {
      const current = prev[path] || []
      const next = current.includes(btnKey)
        ? current.filter((k) => k !== btnKey)
        : [...current, btnKey]
      return { ...prev, [path]: next }
    })
  }

  const hasChanges = useMemo(() => {
    if (!selectedRole) return false
    if (JSON.stringify(checkedKeys.sort()) !== JSON.stringify([...selectedRole.menuKeys].sort())) return true
    const currentRouteMap: Record<string, string[]> = {}
    selectedRole.routes.forEach((r) => {
      currentRouteMap[r.path] = r.buttons.map((b) => b.key)
    })
    return JSON.stringify(routeButtonsMap) !== JSON.stringify(currentRouteMap)
  }, [selectedRole, checkedKeys, routeButtonsMap])

  const diffTargetRole = useMemo(
    () => roles.find((r) => r.id === diffTargetRoleId) || null,
    [roles, diffTargetRoleId]
  )

  const diffResult = useMemo(() => {
    if (!selectedRole || !diffTargetRole) return { added: [], removed: [] }
    const sKeys = new Set(selectedRole.menuKeys)
    const tKeys = new Set(diffTargetRole.menuKeys)
    const added = diffTargetRole.menuKeys.filter((k) => !sKeys.has(k))
    const removed = selectedRole.menuKeys.filter((k) => !tKeys.has(k))
    return { added, removed }
  }, [selectedRole, diffTargetRole])

  const menuKeyLabelMap = useMemo(() => {
    const map: Record<string, string> = {}
    const walk = (nodes: MenuTreeNode[]) => {
      nodes.forEach((n) => {
        map[n.key] = n.label
        if (n.children) walk(n.children)
      })
    }
    walk(menuTree)
    return map
  }, [])

  const checkedRouteNodes = useMemo(() => {
    return checkedKeys
      .map((key) => menuTree.find((n) => n.key === key))
      .filter((n) => n?.path) as MenuTreeNode[]
  }, [checkedKeys])

  return (
    <div className="permission-page">
      <h2 className="page-title">角色权限配置中心</h2>
      <div className="permission-layout">
        <Card className="permission-panel permission-left" title="角色列表" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAddRole}>新增角色</Button>}>
          <List
            dataSource={roles}
            renderItem={(role) => (
              <List.Item
                className={`role-item ${selectedRoleId === role.id ? 'role-item-active' : ''}`}
                onClick={() => selectRole(role.id)}
                actions={[
                  <Tooltip title="编辑" key="edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); handleEditRole(role) }} /></Tooltip>,
                  <Tooltip title="复制" key="copy"><Button type="text" size="small" icon={<CopyOutlined />} onClick={(e) => { e.stopPropagation(); duplicateRole(role.id); message.success('角色已复制') }} /></Tooltip>,
                  role.id !== 'role_admin' ? (
                    <Popconfirm title="确认删除此角色？" key="del" onConfirm={() => { deleteRole(role.id); message.success('角色已删除') }}>
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                    </Popconfirm>
                  ) : null,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={<SafetyOutlined style={{ fontSize: 20, color: selectedRoleId === role.id ? '#1677ff' : '#909399' }} />}
                  title={<span style={{ color: selectedRoleId === role.id ? '#1677ff' : 'inherit' }}>{role.name}</span>}
                  description={role.description}
                />
              </List.Item>
            )}
          />
        </Card>

        <div className="permission-right-area">
          <Card
            className="permission-panel permission-center"
            title="菜单与权限配置"
            extra={
              selectedRole ? (
                <Space>
                  {hasChanges && <Tag color="warning">有未保存的修改</Tag>}
                  <Button type="primary" icon={<SaveOutlined />} disabled={!hasChanges} onClick={handleSave}>保存配置</Button>
                  <Tooltip title="对比角色权限差异">
                    <Button icon={<DiffOutlined />} onClick={() => { setDiffTargetRoleId(null); setDiffModalOpen(true) }}>差异对比</Button>
                  </Tooltip>
                </Space>
              ) : null
            }
          >
            {selectedRole ? (
              <>
                <div className="section-label">菜单权限勾选</div>
                <Tree
                  checkable
                  checkedKeys={checkedKeys}
                  onCheck={handleCheck}
                  treeData={buildAntTreeData(menuTree)}
                  defaultExpandAll
                />
                <Divider />
                <div className="section-label">按钮级操作权限</div>
                {checkedRouteNodes.length === 0 ? (
                  <Empty description="请先勾选菜单" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <div className="button-permission-list">
                    {checkedRouteNodes.map((node) => {
                      const btns = defaultButtons[node.path!] || []
                      const selectedBtns = routeButtonsMap[node.path!] || []
                      return (
                        <div key={node.key} className="button-permission-item">
                          <div className="route-label">{node.label}（{node.path}）</div>
                          <div className="button-checks">
                            {btns.map((btn) => (
                              <Checkbox
                                key={btn.key}
                                checked={selectedBtns.includes(btn.key)}
                                onChange={() => toggleButton(node.path!, btn.key)}
                              >
                                {btn.label}
                              </Checkbox>
                            ))}
                            {btns.length === 0 && <span className="no-buttons">无按钮权限定义</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <Empty description="请从左侧选择一个角色" />
            )}
          </Card>

          <Card className="permission-panel permission-right" title="权限预览" size="small">
            {selectedRole ? (
              <div className="permission-preview">
                <div className="preview-section">
                  <div className="preview-label">角色名称</div>
                  <Tag color="blue">{selectedRole.name}</Tag>
                </div>
                <div className="preview-section">
                  <div className="preview-label">可访问菜单</div>
                  <div className="preview-tags">
                    {selectedRole.menuKeys.map((key) => (
                      <Tag key={key} color="green">{menuKeyLabelMap[key] || key}</Tag>
                    ))}
                    {selectedRole.menuKeys.length === 0 && <span className="empty-hint">暂无菜单权限</span>}
                  </div>
                </div>
                <div className="preview-section">
                  <div className="preview-label">最后更新</div>
                  <span className="preview-time">{selectedRole.updatedAt}</span>
                </div>
                <div className="preview-section preview-routes">
                  <div className="preview-label" style={{ flexBasis: '100%' }}>路由与按钮权限</div>
                  {selectedRole.routes.map((route) => (
                    <div key={route.path} className="preview-route">
                      <div className="preview-route-path">
                        <Tag color="geekblue">{route.label}</Tag>
                        <span className="route-path-text">{route.path}</span>
                      </div>
                      <div className="preview-buttons">
                        {route.buttons.map((btn) => (
                          <Tag key={btn.key} color="orange">{btn.label}</Tag>
                        ))}
                        {route.buttons.length === 0 && <span className="empty-hint">无</span>}
                      </div>
                    </div>
                  ))}
                  {selectedRole.routes.length === 0 && <span className="empty-hint">暂无路由权限</span>}
                </div>
              </div>
            ) : (
              <Empty description="请选择角色以预览权限" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </div>
      </div>

      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleRoleSubmit}
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item name="description" label="角色描述">
            <Input.TextArea placeholder="请输入角色描述" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="权限差异对比"
        open={diffModalOpen}
        onCancel={() => setDiffModalOpen(false)}
        footer={null}
        width={520}
      >
        {selectedRole ? (
          <div>
            <div className="diff-label">当前角色：<Tag color="blue">{selectedRole.name}</Tag></div>
            <div className="diff-target-select" style={{ margin: '12px 0' }}>
              对比角色：
              <select
                value={diffTargetRoleId || ''}
                onChange={(e) => setDiffTargetRoleId(e.target.value || null)}
                className="diff-select"
              >
                <option value="">请选择</option>
                {roles
                  .filter((r) => r.id !== selectedRole.id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
              </select>
            </div>
            {diffTargetRole ? (
              <div className="diff-result">
                {diffResult.added.length === 0 && diffResult.removed.length === 0 ? (
                  <div className="diff-same">两个角色的菜单权限完全一致</div>
                ) : (
                  <>
                    {diffResult.added.length > 0 && (
                      <div className="diff-section">
                        <Tag color="green">对比角色多出的权限</Tag>
                        <div className="diff-tags">
                          {diffResult.added.map((k) => (
                            <Tag key={k} color="green">{menuKeyLabelMap[k] || k}</Tag>
                          ))}
                        </div>
                      </div>
                    )}
                    {diffResult.removed.length > 0 && (
                      <div className="diff-section">
                        <Tag color="red">对比角色缺少的权限</Tag>
                        <div className="diff-tags">
                          {diffResult.removed.map((k) => (
                            <Tag key={k} color="red">{menuKeyLabelMap[k] || k}</Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <Empty description="请选择对比角色" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        ) : (
          <Empty description="请先选择当前角色" />
        )}
      </Modal>
    </div>
  )
}

export const Route = createFileRoute('/_auth/permission')({
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (user) {
      const { isRouteAccessible } = usePermissionStore.getState()
      if (!isRouteAccessible(user.role, '/permission')) {
        throw redirect({ to: '/403' })
      }
    }
  },
  component: PermissionPage,
})
