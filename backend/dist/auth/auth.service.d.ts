import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { User, Role } from "@prisma/client";
type UserWithRole = User & {
    role: Role | null;
};
type UserWithoutPassword = Omit<UserWithRole, "password">;
interface LoginUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: Role | null;
    telegramId?: string | null;
    sipServer?: string | null;
    sipUser?: string | null;
    sipPassword?: string | null;
    sipPort?: number | null;
    sipWsPort?: number | null;
}
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<UserWithoutPassword | null>;
    login(user: LoginUser): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: {
                description: string | null;
                order: number;
                name: string;
                isActive: boolean;
                id: string;
                code: string;
                color: string | null;
                isSystem: boolean;
                permissions: import("@prisma/client/runtime/library").JsonValue;
                createdAt: Date;
                updatedAt: Date;
            } | null | undefined;
            telegramId: string | null | undefined;
            sipServer: string | null | undefined;
            sipUser: string | null | undefined;
            sipPort: number | null | undefined;
            sipWsPort: number | null | undefined;
        };
    }>;
    findUserById(userId: string): Promise<import("../users/entities/user.entity").UserEntity>;
    validatePin(pin: string): Promise<({
        role: {
            description: string | null;
            order: number;
            name: string;
            isActive: boolean;
            id: string;
            code: string;
            color: string | null;
            isSystem: boolean;
            permissions: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        roleId: string;
        sipServer: string | null;
        sipUser: string | null;
        sipPassword: string | null;
        sipPort: number | null;
        paymentType: import(".prisma/client").$Enums.PaymentType;
        monthlySalary: number | null;
        isActive: boolean;
        telegramId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sipWsPort: number | null;
        isDepartmentAccount: boolean;
        pin: string | null;
        pinLookup: string | null;
    }) | null>;
}
export {};
