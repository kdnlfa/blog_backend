import { User } from '@prisma/client';
import { z } from 'zod';
export type UserRole = 'USER' | 'EDITOR' | 'ADMIN';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    displayName: z.ZodString;
    password: z.ZodString;
    agreeToTerms: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "strip", z.ZodTypeAny, {
    email: string;
    username: string;
    displayName: string;
    password: string;
    agreeToTerms: boolean;
}, {
    email: string;
    username: string;
    displayName: string;
    password: string;
    agreeToTerms: boolean;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    rememberMe: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    rememberMe?: boolean | undefined;
}, {
    email: string;
    password: string;
    rememberMe?: boolean | undefined;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    avatar: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    displayName?: string | undefined;
    bio?: string | undefined;
    avatar?: string | undefined;
}, {
    displayName?: string | undefined;
    bio?: string | undefined;
    avatar?: string | undefined;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    oldPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    oldPassword: string;
    newPassword: string;
}, {
    oldPassword: string;
    newPassword: string;
}>;
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export interface AuthTokenPayload {
    userId: string;
    email: string;
    role: UserRole;
}
export interface AuthResult {
    user: Omit<User, 'passwordHash'>;
    token: string;
}
export declare class AuthError extends Error {
    code: string;
    field?: string | undefined;
    constructor(message: string, code: string, field?: string | undefined);
}
export declare class AuthService {
    private generateToken;
    verifyToken(token: string): AuthTokenPayload;
    private hashPassword;
    private verifyPassword;
    private excludePassword;
    register(data: RegisterData): Promise<AuthResult>;
    login(data: LoginData): Promise<AuthResult>;
    getCurrentUser(userId: string): Promise<Omit<User, 'passwordHash'>>;
    updateProfile(userId: string, data: UpdateProfileData): Promise<Omit<User, 'passwordHash'>>;
    changePassword(userId: string, data: ChangePasswordData): Promise<void>;
    getUserByToken(token: string): Promise<Omit<User, 'passwordHash'>>;
}
//# sourceMappingURL=auth.service.d.ts.map