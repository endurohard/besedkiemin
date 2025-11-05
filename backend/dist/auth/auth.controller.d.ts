import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
}
