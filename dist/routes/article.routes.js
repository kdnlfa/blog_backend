"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const article_service_1 = require("../services/article.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const articleService = new article_service_1.ArticleService();
const handleError = (error, res) => {
    console.error('Article route error:', error);
    if (error instanceof article_service_1.ArticleError) {
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
const parseQueryParams = (req, res, next) => {
    try {
        const query = { ...req.query };
        if (query.page) {
            query.page = parseInt(query.page);
        }
        if (query.pageSize) {
            query.pageSize = parseInt(query.pageSize);
        }
        if (query.isPublished !== undefined) {
            query.isPublished = query.isPublished === 'true';
        }
        if (query.tags && typeof query.tags === 'string') {
            query.tags = query.tags.split(',').map(tag => tag.trim());
        }
        req.query = query;
        next();
    }
    catch (error) {
        handleError(error, res);
    }
};
router.get('/', parseQueryParams, async (req, res) => {
    try {
        const result = await articleService.getArticles(req.query);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        handleError(error, res);
    }
});
router.get('/categories', async (req, res) => {
    try {
        const categories = await articleService.getCategories();
        res.json({
            success: true,
            data: categories
        });
    }
    catch (error) {
        handleError(error, res);
    }
});
router.get('/tags', async (req, res) => {
    try {
        const tags = await articleService.getTags();
        res.json({
            success: true,
            data: tags
        });
    }
    catch (error) {
        handleError(error, res);
    }
});
router.get('/:id', auth_middleware_1.optionalAuth, async (req, res) => {
    try {
        const article = await articleService.getArticleById(req.params.id);
        if (!article) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'ARTICLE_NOT_FOUND',
                    message: '文章不存在'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: article
        });
    }
    catch (error) {
        handleError(error, res);
    }
});
router.get('/slug/:slug', auth_middleware_1.optionalAuth, async (req, res) => {
    try {
        const article = await articleService.getArticleBySlug(req.params.slug);
        if (!article) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'ARTICLE_NOT_FOUND',
                    message: '文章不存在'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: article
        });
    }
    catch (error) {
        handleError(error, res);
    }
});
router.post('/', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const article = await articleService.createArticle(req.body, req.user.userId);
        res.status(201).json({
            success: true,
            data: article,
            message: '文章创建成功'
        });
    }
    catch (error) {
        handleError(error, res);
    }
});
router.put('/:id', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const article = await articleService.updateArticle(req.params.id, req.body, req.user.userId);
        res.json({
            success: true,
            data: article,
            message: '文章更新成功'
        });
    }
    catch (error) {
        handleError(error, res);
    }
});
router.delete('/:id', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        await articleService.deleteArticle(req.params.id, req.user.userId);
        res.json({
            success: true,
            message: '文章删除成功'
        });
    }
    catch (error) {
        handleError(error, res);
    }
});
router.post('/:id/like', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            message: '点赞成功'
        });
    }
    catch (error) {
        handleError(error, res);
    }
});
router.get('/author/:authorId', parseQueryParams, async (req, res) => {
    try {
        const query = {
            ...req.query,
            authorId: req.params.authorId
        };
        const result = await articleService.getArticles(query);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        handleError(error, res);
    }
});
exports.default = router;
//# sourceMappingURL=article.routes.js.map