"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = require("../services/auth.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const authService = new auth_service_1.AuthService();
const handleError = (error, res) => {
    console.error('Auth route error:', error);
    if (error instanceof auth_service_1.AuthError) {
        return res.status(400).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                field: error.field
            }
        });
    }
    if (error instanceof zod_1.z.ZodError) {
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
        });
    }
    return res.status(500).json({
        success: false,
        error: {
            code: 'SERVER_ERROR',
            message: '服务器内部错误'
        }
    });
};
router.post('/register', async (req, res) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json({
            success: true,
            data: result,
            message: '注册成功'
        });
    }
    catch (error) {
        handleError(error, res);
    }
});
router.post('/login', async (req, res) => {
    try {
        const result = await authService.login(req.body);
        res.json({
            success: true,
            data: result,
            message: '登录成功'
        });
    }
    catch (error) {
        handleError(error, res);
    }
});
router.get('/me', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const user = await authService.getCurrentUser(req.user.userId);
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        handleError(error, res);
    }
});
router.put('/profile', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const user = await authService.updateProfile(req.user.userId, req.body);
        res.json({
            success: true,
            data: user,
            message: '资料更新成功'
        });
    }
    catch (error) {
        handleError(error, res);
    }
});
router.put('/password', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        await authService.changePassword(req.user.userId, req.body);
        res.json({
            success: true,
            message: '密码修改成功'
        });
    }
    catch (error) {
        handleError(error, res);
    }
});
router.post('/logout', auth_middleware_1.authenticateToken, async (req, res) => {
    res.json({
        success: true,
        message: '退出登录成功'
    });
});
router.get('/verify', auth_middleware_1.authenticateToken, async (req, res) => {
    res.json({
        success: true,
        data: {
            valid: true,
            user: {
                userId: req.user.userId,
                email: req.user.email,
                role: req.user.role
            }
        }
    });
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map