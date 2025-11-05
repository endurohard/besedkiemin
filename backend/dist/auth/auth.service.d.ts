import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<any>;
    login(user: any): Promise<{
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
    findUserById(userId: string): Promise<any>;
}
