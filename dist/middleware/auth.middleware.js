"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireEditor = exports.requireAdmin = exports.requireRole = exports.optionalAuth = exports.authenticateToken = void 0;
const auth_service_1 = require("../services/auth.service");
const authService = new auth_service_1.AuthService();
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!token) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: '请提供认证token'
                }
            });
            return;
        }
        const payload = authService.verifyToken(token);
        req.user = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role
        };
        next();
    }
    catch (error) {
        if (error instanceof auth_service_1.AuthError) {
            res.status(401).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message
                }
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '服务器内部错误'
            }
        });
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (token) {
            try {
                const payload = authService.verifyToken(token);
                req.user = {
                    userId: payload.userId,
                    email: payload.email,
                    role: payload.role
                };
            }
            catch (error) {
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'NOT_AUTHENTICATED',
                    message: '请先登录'
                }
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: '权限不足'
                }
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(['ADMIN']);
exports.requireEditor = (0, exports.requireRole)(['EDITOR', 'ADMIN']);
//# sourceMappingURL=auth.middleware.js.map