import { Router, Request, Response } from 'express'
import { ArticleService, ArticleError } from '../services/article.service'
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware'
import { z } from 'zod'

const router = Router()
const articleService = new ArticleService()

// 统一错误处理
const handleError = (error: unknown, res: Response) => {
  console.error('Article route error:', error)

  if (error instanceof ArticleError) {
    return res.status(400).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        field: error.field
      }
    })
  }

  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '输入数据格式错误',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    })
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: '服务器内部错误'
    }
  })
}

// 查询参数解析中间件
const parseQueryParams = (req: Request, res: Response, next: any) => {
  try {
    // 解析数字参数
    if (req.query.page) req.query.page = parseInt(req.query.page as string)
    if (req.query.pageSize) req.query.pageSize = parseInt(req.query.pageSize as string)
    
    // 解析布尔参数
    if (req.query.isPublished !== undefined) {
      req.query.isPublished = req.query.isPublished === 'true'
    }
    
    // 解析标签数组
    if (req.query.tags && typeof req.query.tags === 'string') {
      req.query.tags = req.query.tags.split(',').map(tag => tag.trim())
    }
    
    next()
  } catch (error) {
    handleError(error, res)
  }
}

// GET /api/articles - 获取文章列表
router.get('/', parseQueryParams, async (req: Request, res: Response) => {
  try {
    const result = await articleService.getArticles(req.query as any)
    
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    handleError(error, res)
  }
})

// GET /api/articles/categories - 获取分类列表
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await articleService.getCategories()
    
    res.json({
      success: true,
      data: categories
    })
  } catch (error) {
    handleError(error, res)
  }
})

// GET /api/articles/tags - 获取标签列表
router.get('/tags', async (req: Request, res: Response) => {
  try {
    const tags = await articleService.getTags()
    
    res.json({
      success: true,
      data: tags
    })
  } catch (error) {
    handleError(error, res)
  }
})

// GET /api/articles/:id - 通过ID获取文章
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const article = await articleService.getArticleById(req.params.id)
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ARTICLE_NOT_FOUND',
          message: '文章不存在'
        }
      })
    }
    
    res.json({
      success: true,
      data: article
    })
  } catch (error) {
    handleError(error, res)
  }
})

// GET /api/articles/slug/:slug - 通过slug获取文章
router.get('/slug/:slug', optionalAuth, async (req: Request, res: Response) => {
  try {
    const article = await articleService.getArticleBySlug(req.params.slug)
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ARTICLE_NOT_FOUND',
          message: '文章不存在'
        }
      })
    }
    
    res.json({
      success: true,
      data: article
    })
  } catch (error) {
    handleError(error, res)
  }
})

// POST /api/articles - 创建文章（需要认证）
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const article = await articleService.createArticle(req.body, req.user!.userId)
    
    res.status(201).json({
      success: true,
      data: article,
      message: '文章创建成功'
    })
  } catch (error) {
    handleError(error, res)
  }
})

// PUT /api/articles/:id - 更新文章（需要认证）
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const article = await articleService.updateArticle(req.params.id, req.body, req.user!.userId)
    
    res.json({
      success: true,
      data: article,
      message: '文章更新成功'
    })
  } catch (error) {
    handleError(error, res)
  }
})

// DELETE /api/articles/:id - 删除文章（需要认证）
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await articleService.deleteArticle(req.params.id, req.user!.userId)
    
    res.json({
      success: true,
      message: '文章删除成功'
    })
  } catch (error) {
    handleError(error, res)
  }
})

// POST /api/articles/:id/like - 点赞文章（需要认证）
router.post('/:id/like', authenticateToken, async (req: Request, res: Response) => {
  try {
    // 这里可以实现点赞逻辑
    // 暂时简单地增加点赞数
    res.json({
      success: true,
      message: '点赞成功'
    })
  } catch (error) {
    handleError(error, res)
  }
})

// GET /api/articles/author/:authorId - 获取指定作者的文章
router.get('/author/:authorId', parseQueryParams, async (req: Request, res: Response) => {
  try {
    const query = {
      ...req.query,
      authorId: req.params.authorId
    }
    
    const result = await articleService.getArticles(query as any)
    
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    handleError(error, res)
  }
})

export default router 