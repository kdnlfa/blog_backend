import { Router, Request, Response } from 'express'
import { AuthService, AuthError } from '../services/auth.service'
import { authenticateToken } from '../middleware/auth.middleware'
import { z } from 'zod'

const router = Router()
const authService = new AuthService()

// 统一错误处理
const handleError = (error: unknown, res: Response) => {
  console.error('Auth route error:', error)

  if (error instanceof AuthError) {
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

// POST /api/auth/register - 用户注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body)
    
    res.status(201).json({
      success: true,
      data: result,
      message: '注册成功'
    })
  } catch (error) {
    handleError(error, res)
  }
})

// POST /api/auth/login - 用户登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body)
    
    res.json({
      success: true,
      data: result,
      message: '登录成功'
    })
  } catch (error) {
    handleError(error, res)
  }
})

// GET /api/auth/me - 获取当前用户信息
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await authService.getCurrentUser(req.user!.userId)
    
    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    handleError(error, res)
  }
})

// PUT /api/auth/profile - 更新用户资料
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await authService.updateProfile(req.user!.userId, req.body)
    
    res.json({
      success: true,
      data: user,
      message: '资料更新成功'
    })
  } catch (error) {
    handleError(error, res)
  }
})

// PUT /api/auth/password - 修改密码
router.put('/password', authenticateToken, async (req: Request, res: Response) => {
  try {
    await authService.changePassword(req.user!.userId, req.body)
    
    res.json({
      success: true,
      message: '密码修改成功'
    })
  } catch (error) {
    handleError(error, res)
  }
})

// POST /api/auth/logout - 用户登出（前端删除token即可，后端不需要特殊处理）
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '退出登录成功'
  })
})

// GET /api/auth/verify - 验证token是否有效
router.get('/verify', authenticateToken, async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      valid: true,
      user: {
        userId: req.user!.userId,
        email: req.user!.email,
        role: req.user!.role
      }
    }
  })
})

export default router 