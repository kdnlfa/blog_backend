import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始初始化数据库...')

  // 清理现有数据（可选）
  console.log('📁 清理现有用户数据...')
  await prisma.user.deleteMany()
  
  // 创建测试用户
  console.log('👤 创建测试用户...')

  // 管理员用户
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      username: 'admin',
      displayName: '系统管理员',
      passwordHash: adminPassword,
      role: 'ADMIN',
      bio: '我是系统管理员，负责维护整个博客系统。',
      isEmailVerified: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
    }
  })

  // 编辑者用户
  const editorPassword = await bcrypt.hash('editor123', 12)
  const editor = await prisma.user.create({
    data: {
      email: 'editor@example.com',
      username: 'editor',
      displayName: '内容编辑',
      passwordHash: editorPassword,
      role: 'EDITOR',
      bio: '我是内容编辑，专注于创作优质的技术文章。',
      isEmailVerified: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=editor'
    }
  })

  // 普通用户
  const userPassword = await bcrypt.hash('user123', 12)
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      username: 'testuser',
      displayName: '测试用户',
      passwordHash: userPassword,
      role: 'USER',
      bio: '我是一个普通用户，喜欢阅读技术文章和分享心得。',
      isEmailVerified: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
    }
  })

  // 王明轩用户（你的账户）
  const ownerPassword = await bcrypt.hash('wang123', 12)
  const owner = await prisma.user.create({
    data: {
      email: 'wang_mx@bupt.edu.cn',
      username: 'wangmingxuan',
      displayName: '王明轩',
      passwordHash: ownerPassword,
      role: 'ADMIN',
      bio: '北京邮电大学在读学生，专注前端开发和技术分享。这是我的个人博客，记录学习和成长的点点滴滴。',
      isEmailVerified: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangmingxuan'
    }
  })

  console.log('✅ 用户创建完成!')
  console.log(`👑 管理员: ${admin.email} (密码: admin123)`)
  console.log(`✏️  编辑者: ${editor.email} (密码: editor123)`)
  console.log(`👤 普通用户: ${user.email} (密码: user123)`)
  console.log(`🎓 王明轩: ${owner.email} (密码: wang123)`)

  // 创建一些示例文章
  console.log('\n📝 创建示例文章...')
  
  const articles = [
    {
      title: 'React Hooks 深度指南',
      slug: 'react-hooks-deep-guide',
      content: `# React Hooks 深度指南

React Hooks 是 React 16.8 引入的新特性，它让你在不编写 class 的情况下使用 state 以及其他的 React 特性。

## useState Hook

\`\`\`jsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>你点击了 {count} 次</p>
      <button onClick={() => setCount(count + 1)}>
        点击我
      </button>
    </div>
  );
}
\`\`\`

## useEffect Hook

useEffect Hook 可以让你在函数组件中执行副作用操作...`,
      excerpt: '深入了解 React Hooks 的使用方法和最佳实践，包括 useState、useEffect 等核心 Hook 的详细讲解。',
      category: '前端开发',
      tags: JSON.stringify(['React', 'Hooks', 'JavaScript']),
      authorId: owner.id,
      isPublished: true
    },
    {
      title: 'TypeScript 项目最佳实践',
      slug: 'typescript-best-practices',
      content: `# TypeScript 项目最佳实践

TypeScript 为 JavaScript 带来了类型安全，让大型项目的开发更加可靠。

## 项目配置

\`\`\`json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true
  }
}
\`\`\`

## 类型定义

良好的类型定义是 TypeScript 项目成功的关键...`,
      excerpt: '分享在实际项目中使用 TypeScript 的经验和技巧，帮助开发者写出更健壮的代码。',
      category: '编程语言',
      tags: JSON.stringify(['TypeScript', '最佳实践', '类型安全']),
      authorId: owner.id,
      isPublished: true
    },
    {
      title: 'Next.js 全栈开发实战',
      slug: 'nextjs-fullstack-development',
      content: `# Next.js 全栈开发实战

Next.js 是一个功能强大的 React 框架，支持服务端渲染、静态站点生成等特性。

## 项目搭建

\`\`\`bash
npx create-next-app@latest my-app --typescript --tailwind --eslint
\`\`\`

## 路由系统

Next.js 13 引入了新的 App Router...`,
      excerpt: '从零开始构建 Next.js 全栈应用，涵盖前端开发、API 路由、数据库集成等各个方面。',
      category: '全栈开发',
      tags: JSON.stringify(['Next.js', '全栈开发', 'React']),
      authorId: editor.id,
      isPublished: true
    }
  ]

  for (const articleData of articles) {
    await prisma.article.create({
      data: articleData
    })
  }

  console.log('✅ 示例文章创建完成!')
  console.log('\n🎉 数据库初始化完成!')
}

main()
  .catch((e) => {
    console.error('❌ 数据库初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 