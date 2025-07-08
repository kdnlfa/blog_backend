import jwt, { SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { PrismaClient, User } from '@prisma/client'
import { z } from 'zod'


const prisma = new PrismaClient()

// JWT密钥（生产环境中应该使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// 用户角色类型
export type UserRole = 'USER' | 'EDITOR' | 'ADMIN'

// 验证模式
export const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  username: z.string().min(3, '用户名至少需要3个字符').max(20, '用户名不能超过20个字符').regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  displayName: z.string().min(2, '显示名称至少需要2个字符').max(50, '显示名称不能超过50个字符'),
  password: z.string().min(6, '密码至少需要6个字符').max(100, '密码不能超过100个字符'),
  agreeToTerms: z.boolean().refine(val => val === true, '请同意用户协议')
})

export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
  rememberMe: z.boolean().optional()
})

export const updateProfileSchema = z.object({
  displayName: z.string().min(2, '显示名称至少需要2个字符').max(50, '显示名称不能超过50个字符').optional(),
  bio: z.string().max(500, '个人简介不能超过500个字符').optional(),
  avatar: z.string().url('请输入有效的头像URL').optional().or(z.literal(''))
})

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z.string().min(6, '新密码至少需要6个字符').max(100, '新密码不能超过100个字符')
})

// 类型定义
export type RegisterData = z.infer<typeof registerSchema>
export type LoginData = z.infer<typeof loginSchema>
export type UpdateProfileData = z.infer<typeof updateProfileSchema>
export type ChangePasswordData = z.infer<typeof changePasswordSchema>

export interface AuthTokenPayload {
  userId: string
  email: string
  role: UserRole
}

export interface AuthResult {
  user: Omit<User, 'passwordHash'>
  token: string
}

// 错误类
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public field?: string
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export class AuthService {
  // 生成JWT Token
  private generateToken(payload: AuthTokenPayload): string {
    return (jwt.sign as any)(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    })
  }

  // 验证JWT Token
  public verifyToken(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'blog-backend',
        audience: 'blog-frontend'
      }) as AuthTokenPayload
    } catch (error) {
      throw new AuthError('Token无效或已过期', 'INVALID_TOKEN')
    }
  }

  // 哈希密码
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  // 验证密码
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  // 移除密码字段
  private excludePassword(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  // 用户注册
  public async register(data: RegisterData): Promise<AuthResult> {
    // 验证数据
    const validatedData = registerSchema.parse(data)

    // 检查邮箱是否已存在
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUserByEmail) {
      throw new AuthError('该邮箱已被注册', 'EMAIL_EXISTS', 'email')
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: validatedData.username }
    })

    if (existingUserByUsername) {
      throw new AuthError('该用户名已被使用', 'USERNAME_EXISTS', 'username')
    }

    // 哈希密码
    const passwordHash = await this.hashPassword(validatedData.password)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        displayName: validatedData.displayName,
        passwordHash,
        role: 'USER'
      }
    })

    // 生成Token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole
    })

    return {
      user: this.excludePassword(user),
      token
    }
  }

  // 用户登录
  public async login(data: LoginData): Promise<AuthResult> {
    // 验证数据
    const validatedData = loginSchema.parse(data)

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!user) {
      throw new AuthError('邮箱或密码错误', 'INVALID_CREDENTIALS')
    }

    // 验证密码
    const isPasswordValid = await this.verifyPassword(validatedData.password, user.passwordHash)

    if (!isPasswordValid) {
      throw new AuthError('邮箱或密码错误', 'INVALID_CREDENTIALS')
    }

    // 更新最后登录时间
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // 生成Token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole
    })

    return {
      user: this.excludePassword(updatedUser),
      token
    }
  }

  // 获取当前用户信息
  public async getCurrentUser(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new AuthError('用户不存在', 'USER_NOT_FOUND')
    }

    return this.excludePassword(user)
  }

  // 更新用户资料
  public async updateProfile(userId: string, data: UpdateProfileData): Promise<Omit<User, 'passwordHash'>> {
    // 验证数据
    const validatedData = updateProfileSchema.parse(data)

    // 更新用户
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...validatedData,
        updatedAt: new Date()
      }
    })

    return this.excludePassword(updatedUser)
  }

  // 修改密码
  public async changePassword(userId: string, data: ChangePasswordData): Promise<void> {
    // 验证数据
    const validatedData = changePasswordSchema.parse(data)

    // 获取用户
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new AuthError('用户不存在', 'USER_NOT_FOUND')
    }

    // 验证当前密码
    const isCurrentPasswordValid = await this.verifyPassword(validatedData.oldPassword, user.passwordHash)

    if (!isCurrentPasswordValid) {
      throw new AuthError('当前密码错误', 'INVALID_PASSWORD')
    }

    // 哈希新密码
    const newPasswordHash = await this.hashPassword(validatedData.newPassword)

    // 更新密码
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      }
    })
  }

  // 根据Token获取用户信息
  public async getUserByToken(token: string): Promise<Omit<User, 'passwordHash'>> {
    const payload = this.verifyToken(token)
    return this.getCurrentUser(payload.userId)
  }
} 