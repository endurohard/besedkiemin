import { Role } from '@prisma/client';
export declare class UserEntity {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: string;
    role?: Role;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    telegramId?: string | null;
    sipServer?: string;
    sipUser?: string;
    sipPassword?: string;
    sipPort?: number;
    sipWsPort?: number;
    constructor(partial: Partial<UserEntity>);
}
