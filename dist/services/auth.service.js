"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.AuthError = exports.changePasswordSchema = exports.updateProfileSchema = exports.loginSchema = exports.registerSchema = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('请输入有效的邮箱地址'),
    username: zod_1.z.string().min(3, '用户名至少需要3个字符').max(20, '用户名不能超过20个字符').regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
    displayName: zod_1.z.string().min(2, '显示名称至少需要2个字符').max(50, '显示名称不能超过50个字符'),
    password: zod_1.z.string().min(6, '密码至少需要6个字符').max(100, '密码不能超过100个字符'),
    agreeToTerms: zod_1.z.boolean().refine(val => val === true, '请同意用户协议')
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('请输入有效的邮箱地址'),
    password: zod_1.z.string().min(1, '请输入密码'),
    rememberMe: zod_1.z.boolean().optional()
});
exports.updateProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(2, '显示名称至少需要2个字符').max(50, '显示名称不能超过50个字符').optional(),
    bio: zod_1.z.string().max(500, '个人简介不能超过500个字符').optional(),
    avatar: zod_1.z.string().url('请输入有效的头像URL').optional().or(zod_1.z.literal(''))
});
exports.changePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(1, '请输入当前密码'),
    newPassword: zod_1.z.string().min(6, '新密码至少需要6个字符').max(100, '新密码不能超过100个字符')
});
class AuthError extends Error {
    constructor(message, code, field) {
        super(message);
        this.code = code;
        this.field = field;
        this.name = 'AuthError';
    }
}
exports.AuthError = AuthError;
class AuthService {
    generateToken(payload) {
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });
    }
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, JWT_SECRET, {
                issuer: 'blog-backend',
                audience: 'blog-frontend'
            });
        }
        catch (error) {
            throw new AuthError('Token无效或已过期', 'INVALID_TOKEN');
        }
    }
    async hashPassword(password) {
        return bcryptjs_1.default.hash(password, 12);
    }
    async verifyPassword(password, hash) {
        return bcryptjs_1.default.compare(password, hash);
    }
    excludePassword(user) {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async register(data) {
        const validatedData = exports.registerSchema.parse(data);
        const existingUserByEmail = await prisma.user.findUnique({
            where: { email: validatedData.email }
        });
        if (existingUserByEmail) {
            throw new AuthError('该邮箱已被注册', 'EMAIL_EXISTS', 'email');
        }
        const existingUserByUsername = await prisma.user.findUnique({
            where: { username: validatedData.username }
        });
        if (existingUserByUsername) {
            throw new AuthError('该用户名已被使用', 'USERNAME_EXISTS', 'username');
        }
        const passwordHash = await this.hashPassword(validatedData.password);
        const user = await prisma.user.create({
            data: {
                email: validatedData.email,
                username: validatedData.username,
                displayName: validatedData.displayName,
                passwordHash,
                role: 'USER'
            }
        });
        const token = this.generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });
        return {
            user: this.excludePassword(user),
            token
        };
    }
    async login(data) {
        const validatedData = exports.loginSchema.parse(data);
        const user = await prisma.user.findUnique({
            where: { email: validatedData.email }
        });
        if (!user) {
            throw new AuthError('邮箱或密码错误', 'INVALID_CREDENTIALS');
        }
        const isPasswordValid = await this.verifyPassword(validatedData.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new AuthError('邮箱或密码错误', 'INVALID_CREDENTIALS');
        }
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        const token = this.generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });
        return {
            user: this.excludePassword(updatedUser),
            token
        };
    }
    async getCurrentUser(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new AuthError('用户不存在', 'USER_NOT_FOUND');
        }
        return this.excludePassword(user);
    }
    async updateProfile(userId, data) {
        const validatedData = exports.updateProfileSchema.parse(data);
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...validatedData,
                updatedAt: new Date()
            }
        });
        return this.excludePassword(updatedUser);
    }
    async changePassword(userId, data) {
        const validatedData = exports.changePasswordSchema.parse(data);
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new AuthError('用户不存在', 'USER_NOT_FOUND');
        }
        const isCurrentPasswordValid = await this.verifyPassword(validatedData.oldPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new AuthError('当前密码错误', 'INVALID_PASSWORD');
        }
        const newPasswordHash = await this.hashPassword(validatedData.newPassword);
        await prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: newPasswordHash,
                updatedAt: new Date()
            }
        });
    }
    async getUserByToken(token) {
        const payload = this.verifyToken(token);
        return this.getCurrentUser(payload.userId);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map