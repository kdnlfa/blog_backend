import { User } from '@prisma/client';
import { z } from 'zod';
export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export declare const createArticleSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
    excerpt: z.ZodOptional<z.ZodString>;
    category: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    imageUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    isPublished: z.ZodDefault<z.ZodBoolean>;
    publishDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    content: string;
    category: string;
    tags: string[];
    isPublished: boolean;
    excerpt?: string | undefined;
    imageUrl?: string | undefined;
    publishDate?: string | undefined;
}, {
    title: string;
    content: string;
    category: string;
    excerpt?: string | undefined;
    tags?: string[] | undefined;
    imageUrl?: string | undefined;
    isPublished?: boolean | undefined;
    publishDate?: string | undefined;
}>;
export declare const updateArticleSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    excerpt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    imageUrl: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    isPublished: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    publishDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    content?: string | undefined;
    excerpt?: string | undefined;
    category?: string | undefined;
    tags?: string[] | undefined;
    imageUrl?: string | undefined;
    isPublished?: boolean | undefined;
    publishDate?: string | undefined;
}, {
    title?: string | undefined;
    content?: string | undefined;
    excerpt?: string | undefined;
    category?: string | undefined;
    tags?: string[] | undefined;
    imageUrl?: string | undefined;
    isPublished?: boolean | undefined;
    publishDate?: string | undefined;
}>;
export declare const articleQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    category: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isPublished: z.ZodOptional<z.ZodBoolean>;
    authorId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "publishDate", "title", "viewCount"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    sortBy: "createdAt" | "title" | "publishDate" | "viewCount";
    sortOrder: "asc" | "desc";
    category?: string | undefined;
    tags?: string[] | undefined;
    isPublished?: boolean | undefined;
    authorId?: string | undefined;
    search?: string | undefined;
}, {
    category?: string | undefined;
    tags?: string[] | undefined;
    isPublished?: boolean | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    authorId?: string | undefined;
    search?: string | undefined;
    sortBy?: "createdAt" | "title" | "publishDate" | "viewCount" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type CreateArticleData = z.infer<typeof createArticleSchema>;
export type UpdateArticleData = z.infer<typeof updateArticleSchema>;
export type ArticleQuery = z.infer<typeof articleQuerySchema>;
export interface ArticleWithAuthor {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    category: string;
    tags: string[];
    imageUrl: string | null;
    isPublished: boolean;
    publishDate: Date;
    readTime: string;
    viewCount: number;
    likeCount: number;
    createdAt: Date;
    updatedAt: Date;
    authorId: string;
    author: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>;
}
export interface ArticleListResponse {
    articles: ArticleWithAuthor[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}
export declare class ArticleError extends Error {
    code: string;
    field?: string | undefined;
    constructor(message: string, code: string, field?: string | undefined);
}
export declare class ArticleService {
    createArticle(data: CreateArticleData, authorId: string): Promise<ArticleWithAuthor>;
    getArticles(query: ArticleQuery): Promise<ArticleListResponse>;
    getArticleById(id: string): Promise<ArticleWithAuthor | null>;
    getArticleBySlug(slug: string): Promise<ArticleWithAuthor | null>;
    updateArticle(id: string, data: UpdateArticleData, userId: string): Promise<ArticleWithAuthor>;
    deleteArticle(id: string, userId: string): Promise<void>;
    getCategories(): Promise<{
        name: string;
        count: number;
    }[]>;
    getTags(): Promise<{
        name: string;
        count: number;
    }[]>;
    private generateUniqueSlug;
    private generateExcerpt;
    private calculateReadTime;
    private parseTags;
}
//# sourceMappingURL=article.service.d.ts.map