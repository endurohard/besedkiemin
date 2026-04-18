import { Role, PaymentType } from "@prisma/client";
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
    sipServer?: string | null;
    sipUser?: string | null;
    sipPassword?: string | null;
    sipPort?: number | null;
    sipWsPort?: number | null;
    paymentType: PaymentType;
    monthlySalary?: number | null;
    constructor(partial: Partial<UserEntity>);
}
