import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PinLoginDto } from './dto/pin-login.dto';
import { TelegramService } from '../telegram/telegram.service';
import { UsersService } from '../users/users.service';
import { AuthenticatedUser } from './strategies/jwt.strategy';
export declare class AuthController {
    private readonly authService;
    private readonly telegramService;
    private readonly usersService;
    constructor(authService: AuthService, telegramService: TelegramService, usersService: UsersService);
    login(loginDto: LoginDto, req: any): Promise<{
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
            };
            telegramId: string;
            sipServer: string;
            sipUser: string;
            sipPort: number;
            sipWsPort: number;
        };
    }>;
    getProfile(user: AuthenticatedUser): AuthenticatedUser;
    requestTelegramCode(body: {
        email: string;
        password: string;
    }): Promise<{
        code: string;
        expiresIn: number;
        message: string;
    }>;
    checkTelegramAuth(body: {
        code: string;
    }): Promise<{
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
            };
            telegramId: string;
            sipServer: string;
            sipUser: string;
            sipPort: number;
            sipWsPort: number;
        };
    } | {
        status: string;
        message: string;
    }>;
    pinLogin(pinLoginDto: PinLoginDto): Promise<{
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
            };
            telegramId: string;
            sipServer: string;
            sipUser: string;
            sipPort: number;
            sipWsPort: number;
        };
    }>;
    setMyPin(user: AuthenticatedUser, body: {
        pin: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    setUserPin(userId: string, body: {
        pin: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
