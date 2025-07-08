import { PrismaClient, Article, User } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// 文章状态类型
export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

// 验证模式
export const createArticleSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
  content: z.string().min(1, '内容不能为空'),
  excerpt: z.string().max(500, '摘要不能超过500个字符').optional(),
  category: z.string().min(1, '分类不能为空'),
  tags: z.array(z.string()).default([]),
  imageUrl: z.string().url('请输入有效的图片URL').optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
  publishDate: z.string().datetime().optional()
})

export const updateArticleSchema = createArticleSchema.partial()

export const articleQuerySchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  authorId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'publishDate', 'title', 'viewCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// 输入类型
export type CreateArticleData = z.infer<typeof createArticleSchema>
export type UpdateArticleData = z.infer<typeof updateArticleSchema>
export type ArticleQuery = z.infer<typeof articleQuerySchema>

// 返回类型
export interface ArticleWithAuthor extends Article {
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>
}

export interface ArticleListResponse {
  articles: ArticleWithAuthor[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 错误类
export class ArticleError extends Error {
  constructor(
    message: string,
    public code: string,
    public field?: string
  ) {
    super(message)
    this.name = 'ArticleError'
  }
}

// 文章服务类
export class ArticleService {
  // 创建文章
  public async createArticle(data: CreateArticleData, authorId: string): Promise<ArticleWithAuthor> {
    // 验证数据
    const validatedData = createArticleSchema.parse(data)
    
    // 生成唯一的slug
    const slug = await this.generateUniqueSlug(validatedData.title)
    
    // 计算阅读时间
    const readTime = this.calculateReadTime(validatedData.content)
    
    // 创建文章
    const article = await prisma.article.create({
      data: {
        title: validatedData.title,
        slug,
        content: validatedData.content,
        excerpt: validatedData.excerpt || this.generateExcerpt(validatedData.content),
        category: validatedData.category,
        tags: JSON.stringify(validatedData.tags),
        imageUrl: validatedData.imageUrl,
        isPublished: validatedData.isPublished,
        publishDate: validatedData.publishDate ? new Date(validatedData.publishDate) : new Date(),
        readTime,
        authorId
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      }
    })
    
    // 转换标签字符串为数组
    return {
      ...article,
      tags: this.parseTags(article.tags)
    }
  }

  // 获取文章列表
  public async getArticles(query: ArticleQuery): Promise<ArticleListResponse> {
    const validatedQuery = articleQuerySchema.parse(query)
    
    // 构建查询条件
    const where: any = {}
    
    if (validatedQuery.category) {
      where.category = validatedQuery.category
    }
    
    if (validatedQuery.tags && validatedQuery.tags.length > 0) {
      where.tags = {
        contains: validatedQuery.tags[0] // 简单实现，后续可以优化为支持多标签
      }
    }
    
    if (validatedQuery.isPublished !== undefined) {
      where.isPublished = validatedQuery.isPublished
    }
    
    if (validatedQuery.authorId) {
      where.authorId = validatedQuery.authorId
    }
    
    if (validatedQuery.search) {
      where.OR = [
        { title: { contains: validatedQuery.search } },
        { content: { contains: validatedQuery.search } },
        { excerpt: { contains: validatedQuery.search } }
      ]
    }
    
    // 计算分页
    const skip = (validatedQuery.page - 1) * validatedQuery.pageSize
    
    // 获取文章列表
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        },
        orderBy: {
          [validatedQuery.sortBy]: validatedQuery.sortOrder
        },
        skip,
        take: validatedQuery.pageSize
      }),
      prisma.article.count({ where })
    ])
    
    // 转换标签字符串为数组
    const transformedArticles = articles.map(article => ({
      ...article,
      tags: this.parseTags(article.tags)
    }))
    
    return {
      articles: transformedArticles,
      pagination: {
        page: validatedQuery.page,
        pageSize: validatedQuery.pageSize,
        total,
        totalPages: Math.ceil(total / validatedQuery.pageSize)
      }
    }
  }

  // 通过ID获取文章
  public async getArticleById(id: string): Promise<ArticleWithAuthor | null> {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      }
    })
    
    if (article) {
      return {
        ...article,
        tags: this.parseTags(article.tags)
      }
    }
    
    return null
  }

  // 通过slug获取文章
  public async getArticleBySlug(slug: string): Promise<ArticleWithAuthor | null> {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      }
    })
    
    if (article) {
      // 增加浏览量
      await prisma.article.update({
        where: { id: article.id },
        data: { viewCount: { increment: 1 } }
      })
      
      return {
        ...article,
        tags: this.parseTags(article.tags)
      }
    }
    
    return null
  }

  // 更新文章
  public async updateArticle(id: string, data: UpdateArticleData, userId: string): Promise<ArticleWithAuthor> {
    // 验证数据
    const validatedData = updateArticleSchema.parse(data)
    
    // 检查文章是否存在
    const existingArticle = await prisma.article.findUnique({
      where: { id }
    })
    
    if (!existingArticle) {
      throw new ArticleError('文章不存在', 'ARTICLE_NOT_FOUND')
    }
    
    // 检查权限（只有作者或管理员可以编辑）
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user || (existingArticle.authorId !== userId && user.role !== 'ADMIN')) {
      throw new ArticleError('没有权限编辑此文章', 'PERMISSION_DENIED')
    }
    
    // 更新数据
    const updateData: any = { ...validatedData }
    
    // 如果标题发生变化，重新生成slug
    if (validatedData.title && validatedData.title !== existingArticle.title) {
      updateData.slug = await this.generateUniqueSlug(validatedData.title, existingArticle.id)
    }
    
    // 如果内容发生变化，重新计算摘要和阅读时间
    if (validatedData.content) {
      updateData.readTime = this.calculateReadTime(validatedData.content)
      if (!validatedData.excerpt) {
        updateData.excerpt = this.generateExcerpt(validatedData.content)
      }
    }
    
    // 处理标签
    if (validatedData.tags) {
      updateData.tags = JSON.stringify(validatedData.tags)
    }
    
    // 处理发布日期
    if (validatedData.publishDate) {
      updateData.publishDate = new Date(validatedData.publishDate)
    }
    
    // 更新文章
    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      }
    })
    
    // 转换标签字符串为数组
    return {
      ...updatedArticle,
      tags: this.parseTags(updatedArticle.tags)
    }
  }

  // 删除文章
  public async deleteArticle(id: string, userId: string): Promise<void> {
    // 检查文章是否存在
    const existingArticle = await prisma.article.findUnique({
      where: { id }
    })
    
    if (!existingArticle) {
      throw new ArticleError('文章不存在', 'ARTICLE_NOT_FOUND')
    }
    
    // 检查权限
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user || (existingArticle.authorId !== userId && user.role !== 'ADMIN')) {
      throw new ArticleError('没有权限删除此文章', 'PERMISSION_DENIED')
    }
    
    // 删除文章
    await prisma.article.delete({
      where: { id }
    })
  }

  // 获取分类列表
  public async getCategories(): Promise<{ name: string; count: number }[]> {
    const categories = await prisma.article.groupBy({
      by: ['category'],
      where: { isPublished: true },
      _count: { category: true }
    })
    
    return categories.map(cat => ({
      name: cat.category,
      count: cat._count.category
    }))
  }

  // 获取标签列表
  public async getTags(): Promise<{ name: string; count: number }[]> {
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      select: { tags: true }
    })
    
    const tagCount: Record<string, number> = {}
    
    articles.forEach(article => {
      try {
        const tags = JSON.parse(article.tags) as string[]
        tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1
        })
      } catch (e) {
        // 忽略解析错误
      }
    })
    
    return Object.entries(tagCount).map(([name, count]) => ({
      name,
      count
    }))
  }

  // 生成唯一slug
  private async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    // 如果全是中文字符，使用拼音或者随机字符
    if (!/[a-z0-9]/.test(slug)) {
      slug = `article-${Date.now()}`
    }
    
    let counter = 0
    let uniqueSlug = slug
    
    while (true) {
      const existingArticle = await prisma.article.findUnique({
        where: { slug: uniqueSlug }
      })
      
      if (!existingArticle || existingArticle.id === excludeId) {
        break
      }
      
      counter++
      uniqueSlug = `${slug}-${counter}`
    }
    
    return uniqueSlug
  }

  // 生成摘要
  private generateExcerpt(content: string): string {
    // 移除Markdown语法
    const plainText = content
      .replace(/#{1,6}\s/g, '') // 标题
      .replace(/\*\*(.*?)\*\*/g, '$1') // 粗体
      .replace(/\*(.*?)\*/g, '$1') // 斜体
      .replace(/`(.*?)`/g, '$1') // 代码
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '') // 图片
      .replace(/\n+/g, ' ') // 换行
      .trim()
    
    // 截取前150个字符
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText
  }

  // 计算阅读时间
  private calculateReadTime(content: string): string {
    const wordsPerMinute = 200 // 平均每分钟阅读字数
    const wordCount = content.length
    const minutes = Math.ceil(wordCount / wordsPerMinute)
    
    return `${minutes}分钟`
  }

  // 解析标签字符串为数组
  private parseTags(tagsString: string): string[] {
    try {
      const parsed = JSON.parse(tagsString)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      return []
    }
  }
} 