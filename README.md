# 博客后端API

一个基于 Node.js + Express + TypeScript + Prisma 的博客系统后端API。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境变量配置

创建 `.env` 文件：

```bash
# 数据库配置
DATABASE_URL="file:./dev.db"

# JWT配置
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# 服务器配置
PORT=8000
NODE_ENV=development

# 前端地址（CORS配置）
FRONTEND_URL="http://localhost:3000"
```

### 3. 数据库初始化

```bash
# 生成Prisma客户端
npm run db:generate

# 推送数据库架构
npm run db:push

# 初始化测试数据
npm run db:seed
```

### 4. 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

## 📋 API 端点

### 认证相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/profile` - 更新用户资料
- `PUT /api/auth/password` - 修改密码
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/verify` - 验证token

### 其他

- `GET /health` - 健康检查
- `GET /` - API信息

## 🔐 测试账户

运行数据库种子脚本后，可以使用以下测试账户：

- **管理员**: admin@example.com / admin123
- **编辑者**: editor@example.com / editor123  
- **普通用户**: user@example.com / user123
- **王明轩**: wang_mx@bupt.edu.cn / wang123

## 🛠 技术栈

- **运行环境**: Node.js
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: SQLite (可切换到 PostgreSQL)
- **ORM**: Prisma
- **认证**: JWT
- **密码加密**: bcryptjs
- **数据验证**: Zod
- **安全**: Helmet, CORS, Rate Limiting

## 📁 项目结构

```
backend/
├── src/
│   ├── middleware/       # 中间件
│   ├── routes/          # 路由
│   ├── services/        # 业务逻辑
│   ├── scripts/         # 脚本文件
│   └── index.ts         # 服务器入口
├── prisma/
│   └── schema.prisma    # 数据库模式
├── package.json
└── README.md
```

## 🔧 开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建项目
npm run start        # 启动生产服务器
npm run db:generate  # 生成Prisma客户端
npm run db:push      # 推送数据库架构
npm run db:studio    # 打开Prisma Studio
npm run db:seed      # 初始化测试数据
```

## 📊 数据库管理

使用 Prisma Studio 可视化管理数据库：

```bash
npm run db:studio
```

访问 http://localhost:5555 查看数据库内容。

## 🛡 安全特性

- JWT token认证
- 密码哈希加密（bcrypt）
- 请求速率限制
- CORS保护
- 输入数据验证
- SQL注入防护（Prisma）

## 📝 API文档

### 用户注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "displayName": "Display Name",
  "password": "password123",
  "agreeToTerms": true
}
```

### 用户登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": true
}
```

### 获取用户信息

```http
GET /api/auth/me
Authorization: Bearer <token>
```

## 🚀 部署

### 环境变量

生产环境需要设置以下环境变量：

- `DATABASE_URL` - 数据库连接字符串
- `JWT_SECRET` - JWT密钥（强密码）
- `FRONTEND_URL` - 前端地址
- `PORT` - 服务器端口

### 数据库迁移

从SQLite切换到PostgreSQL：

1. 修改 `prisma/schema.prisma` 中的 `datasource`
2. 设置 `DATABASE_URL` 环境变量
3. 运行 `npm run db:push`

## �� 许可证

MIT License 