"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticleService = exports.ArticleError = exports.articleQuerySchema = exports.updateArticleSchema = exports.createArticleSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
exports.createArticleSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
    content: zod_1.z.string().min(1, '内容不能为空'),
    excerpt: zod_1.z.string().max(500, '摘要不能超过500个字符').optional(),
    category: zod_1.z.string().min(1, '分类不能为空'),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    imageUrl: zod_1.z.string().url('请输入有效的图片URL').optional().or(zod_1.z.literal('')),
    isPublished: zod_1.z.boolean().default(false),
    publishDate: zod_1.z.string().datetime().optional()
});
exports.updateArticleSchema = exports.createArticleSchema.partial();
exports.articleQuerySchema = zod_1.z.object({
    page: zod_1.z.number().min(1).default(1),
    pageSize: zod_1.z.number().min(1).max(100).default(10),
    category: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    isPublished: zod_1.z.boolean().optional(),
    authorId: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['createdAt', 'publishDate', 'title', 'viewCount']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
});
class ArticleError extends Error {
    constructor(message, code, field) {
        super(message);
        this.code = code;
        this.field = field;
        this.name = 'ArticleError';
    }
}
exports.ArticleError = ArticleError;
class ArticleService {
    async createArticle(data, authorId) {
        const validatedData = exports.createArticleSchema.parse(data);
        const slug = await this.generateUniqueSlug(validatedData.title);
        const readTime = this.calculateReadTime(validatedData.content);
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
        });
        return {
            ...article,
            tags: this.parseTags(article.tags)
        };
    }
    async getArticles(query) {
        const validatedQuery = exports.articleQuerySchema.parse(query);
        const where = {};
        if (validatedQuery.category) {
            where.category = validatedQuery.category;
        }
        if (validatedQuery.tags && validatedQuery.tags.length > 0) {
            where.tags = {
                contains: validatedQuery.tags[0]
            };
        }
        if (validatedQuery.isPublished !== undefined) {
            where.isPublished = validatedQuery.isPublished;
        }
        if (validatedQuery.authorId) {
            where.authorId = validatedQuery.authorId;
        }
        if (validatedQuery.search) {
            where.OR = [
                { title: { contains: validatedQuery.search } },
                { content: { contains: validatedQuery.search } },
                { excerpt: { contains: validatedQuery.search } }
            ];
        }
        const skip = (validatedQuery.page - 1) * validatedQuery.pageSize;
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
        ]);
        const transformedArticles = articles.map(article => ({
            ...article,
            tags: this.parseTags(article.tags)
        }));
        return {
            articles: transformedArticles,
            pagination: {
                page: validatedQuery.page,
                pageSize: validatedQuery.pageSize,
                total,
                totalPages: Math.ceil(total / validatedQuery.pageSize)
            }
        };
    }
    async getArticleById(id) {
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
        });
        if (article) {
            return {
                ...article,
                tags: this.parseTags(article.tags)
            };
        }
        return null;
    }
    async getArticleBySlug(slug) {
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
        });
        if (article) {
            await prisma.article.update({
                where: { id: article.id },
                data: { viewCount: { increment: 1 } }
            });
            return {
                ...article,
                tags: this.parseTags(article.tags)
            };
        }
        return null;
    }
    async updateArticle(id, data, userId) {
        const validatedData = exports.updateArticleSchema.parse(data);
        const existingArticle = await prisma.article.findUnique({
            where: { id }
        });
        if (!existingArticle) {
            throw new ArticleError('文章不存在', 'ARTICLE_NOT_FOUND');
        }
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user || (existingArticle.authorId !== userId && user.role !== 'ADMIN')) {
            throw new ArticleError('没有权限编辑此文章', 'PERMISSION_DENIED');
        }
        const updateData = { ...validatedData };
        if (validatedData.title && validatedData.title !== existingArticle.title) {
            updateData.slug = await this.generateUniqueSlug(validatedData.title, existingArticle.id);
        }
        if (validatedData.content) {
            updateData.readTime = this.calculateReadTime(validatedData.content);
            if (!validatedData.excerpt) {
                updateData.excerpt = this.generateExcerpt(validatedData.content);
            }
        }
        if (validatedData.tags) {
            updateData.tags = JSON.stringify(validatedData.tags);
        }
        if (validatedData.publishDate) {
            updateData.publishDate = new Date(validatedData.publishDate);
        }
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
        });
        return {
            ...updatedArticle,
            tags: this.parseTags(updatedArticle.tags)
        };
    }
    async deleteArticle(id, userId) {
        const existingArticle = await prisma.article.findUnique({
            where: { id }
        });
        if (!existingArticle) {
            throw new ArticleError('文章不存在', 'ARTICLE_NOT_FOUND');
        }
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user || (existingArticle.authorId !== userId && user.role !== 'ADMIN')) {
            throw new ArticleError('没有权限删除此文章', 'PERMISSION_DENIED');
        }
        await prisma.article.delete({
            where: { id }
        });
    }
    async getCategories() {
        const categories = await prisma.article.groupBy({
            by: ['category'],
            where: { isPublished: true },
            _count: { category: true }
        });
        return categories.map(cat => ({
            name: cat.category,
            count: cat._count.category
        }));
    }
    async getTags() {
        const articles = await prisma.article.findMany({
            where: { isPublished: true },
            select: { tags: true }
        });
        const tagCount = {};
        articles.forEach(article => {
            try {
                const tags = JSON.parse(article.tags);
                tags.forEach(tag => {
                    tagCount[tag] = (tagCount[tag] || 0) + 1;
                });
            }
            catch (e) {
            }
        });
        return Object.entries(tagCount).map(([name, count]) => ({
            name,
            count
        }));
    }
    async generateUniqueSlug(title, excludeId) {
        let slug = title
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        if (!/[a-z0-9]/.test(slug)) {
            slug = `article-${Date.now()}`;
        }
        let counter = 0;
        let uniqueSlug = slug;
        while (true) {
            const existingArticle = await prisma.article.findUnique({
                where: { slug: uniqueSlug }
            });
            if (!existingArticle || existingArticle.id === excludeId) {
                break;
            }
            counter++;
            uniqueSlug = `${slug}-${counter}`;
        }
        return uniqueSlug;
    }
    generateExcerpt(content) {
        const plainText = content
            .replace(/#{1,6}\s/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
            .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
            .replace(/\n+/g, ' ')
            .trim();
        return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
    }
    calculateReadTime(content) {
        const wordsPerMinute = 200;
        const wordCount = content.length;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return `${minutes}分钟`;
    }
    parseTags(tagsString) {
        try {
            const parsed = JSON.parse(tagsString);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch (error) {
            return [];
        }
    }
}
exports.ArticleService = ArticleService;
//# sourceMappingURL=article.service.js.map