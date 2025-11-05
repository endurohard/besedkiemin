import { UserRole } from '@prisma/client';
export declare class CreateUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    sipServer?: string;
    sipUser?: string;
    sipPassword?: string;
    sipPort?: number;
}
