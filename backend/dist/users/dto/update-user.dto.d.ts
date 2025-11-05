import { UserRole } from '@prisma/client';
export declare class UpdateUserDto {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    isActive?: boolean;
    telegramId?: string;
    sipServer?: string;
    sipUser?: string;
    sipPassword?: string;
    sipPort?: number;
}
