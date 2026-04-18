import { PaymentType } from '@prisma/client';
export declare class CreateUserDto {
    email?: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: string;
    sipServer?: string;
    sipUser?: string;
    sipPassword?: string;
    sipPort?: number;
    paymentType?: PaymentType;
    monthlySalary?: number;
}
