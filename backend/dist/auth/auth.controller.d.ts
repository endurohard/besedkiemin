import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { TelegramService } from '../telegram/telegram.service';
export declare class AuthController {
    private readonly authService;
    private readonly telegramService;
    constructor(authService: AuthService, telegramService: TelegramService);
    login(loginDto: LoginDto, req: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
            role: any;
            telegramId: any;
            sipServer: any;
            sipUser: any;
            sipPassword: any;
            sipPort: any;
            sipWsPort: any;
        };
    }>;
    getProfile(user: any): any;
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
            id: any;
            email: any;
            firstName: any;
            lastName: any;
            role: any;
            telegramId: any;
            sipServer: any;
            sipUser: any;
            sipPassword: any;
            sipPort: any;
            sipWsPort: any;
        };
    } | {
        status: string;
        message: string;
    }>;
}
