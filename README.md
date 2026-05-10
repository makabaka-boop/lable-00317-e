# 后台管理系统

基于 React + TanStack Router + Ant Design + Zustand 的后台管理系统。

## How to Run

### 本地开发

```bash
cd frontend-admin
npm install
npm run dev
```

### Docker 部署

```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问地址：http://localhost:8080

### 跨平台构建（ARM/X86）

```bash
# 构建多平台镜像
docker buildx build --platform linux/amd64,linux/arm64 -t frontend-admin:latest ./frontend-admin
```

## Services

| 服务名 | 端口 | 说明 |
|--------|------|------|
| frontend-admin | 8080 | 前端管理后台 |

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| user | user123 | 普通用户 |

## 题目内容

集成 TanStack Router，要求最小化实现如下功能：

1. 这是一个后台管理系统，除了登录页，其它都是需要认证的
2. 模拟一个请求用户信息的接口，进行认证登录
3. 当用户访问需认证的页面时，若未认证，则跳转登录页，认证成功再回到此页面，若认证，则直接放行

## 项目结构

```
├── frontend-admin/                # 前端管理后台
│   ├── src/
│   │   ├── api/                   # API 接口
│   │   │   ├── auth.ts            # 认证相关接口
│   │   │   └── mock.ts            # Mock 数据
│   │   ├── routes/                # 路由页面
│   │   │   ├── _auth/             # 需要认证的页面
│   │   │   │   ├── dashboard.tsx  # 仪表盘
│   │   │   │   ├── settings.tsx   # 系统设置
│   │   │   │   └── users.tsx      # 用户管理
│   │   │   ├── __root.tsx         # 根路由
│   │   │   ├── _auth.tsx          # 认证布局
│   │   │   ├── 403.tsx            # 403 页面
│   │   │   ├── auth.scss          # 认证布局样式
│   │   │   ├── index.tsx          # 首页重定向
│   │   │   └── login.tsx          # 登录页
│   │   ├── stores/                # 状态管理
│   │   │   ├── auth.ts            # 认证状态
│   │   │   └── users.ts           # 用户状态
│   │   ├── styles/                # 全局样式
│   │   │   ├── global.scss        # 全局样式
│   │   │   └── variables.scss     # 样式变量
│   │   ├── types/                 # 类型定义
│   │   │   └── index.ts
│   │   ├── main.tsx               # 入口文件
│   │   ├── routeTree.gen.ts       # 路由树（自动生成）
│   │   └── vite-env.d.ts          # Vite 类型声明
│   ├── Dockerfile                 # Docker 构建文件
│   ├── index.html
│   ├── nginx.conf                 # Nginx 配置
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── docker-compose.yml             # Docker 编排配置
└── README.md
```

## 功能特性

- ✅ 路由认证守卫
- ✅ 角色权限控制
- ✅ 用户管理（管理员）
- ✅ 系统设置
- ✅ 数据本地持久化
- ✅ 响应式布局
