import { UserRole } from '@prisma/client';
export declare class UserEntity {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    sipServer?: string;
    sipUser?: string;
    sipPassword?: string;
    sipPort?: number;
    sipWsPort?: number;
    constructor(partial: Partial<UserEntity>);
}
