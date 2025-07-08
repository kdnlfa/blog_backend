"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const article_routes_1 = __importDefault(require("./routes/article.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: '请求过于频繁，请稍后再试'
        }
    }
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_AUTH_ATTEMPTS',
            message: '认证尝试次数过多，请15分钟后再试'
        }
    }
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: '服务器运行正常',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
app.use('/api/auth', authLimiter, auth_routes_1.default);
app.use('/api/articles', article_routes_1.default);
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '博客后端API服务',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            articles: '/api/articles',
            docs: 'https://github.com/your-username/blog-backend#api-documentation'
        }
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `路径 ${req.originalUrl} 不存在`
        }
    });
});
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '服务器内部错误'
        }
    });
});
app.listen(PORT, () => {
    console.log(`🚀 服务器启动成功！`);
    console.log(`📍 地址: http://localhost:${PORT}`);
    console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 数据库: SQLite`);
    console.log(`📋 API文档: http://localhost:${PORT}/`);
    console.log('\n可用端点:');
    console.log(`  GET  /health              - 健康检查`);
    console.log(`  POST /api/auth/register   - 用户注册`);
    console.log(`  POST /api/auth/login      - 用户登录`);
    console.log(`  GET  /api/auth/me         - 获取用户信息`);
    console.log(`  PUT  /api/auth/profile    - 更新用户资料`);
    console.log(`  PUT  /api/auth/password   - 修改密码`);
    console.log(`  POST /api/auth/logout     - 用户登出`);
    console.log(`  GET  /api/articles        - 获取文章列表`);
    console.log(`  POST /api/articles        - 创建文章`);
    console.log(`  GET  /api/articles/:id    - 获取文章详情`);
    console.log(`  PUT  /api/articles/:id    - 更新文章`);
    console.log(`  DELETE /api/articles/:id  - 删除文章`);
});
process.on('SIGTERM', () => {
    console.log('\n🛑 收到SIGTERM信号，开始优雅关闭...');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('\n🛑 收到SIGINT信号，开始优雅关闭...');
    process.exit(0);
});
//# sourceMappingURL=index.js.map