import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto): Promise<UserEntity>;
    findAll(): Promise<UserEntity[]>;
    findOne(id: string): Promise<UserEntity>;
    findByEmail(email: string): Promise<{
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        roleId: string;
        sipServer: string | null;
        sipUser: string | null;
        sipPassword: string | null;
        sipPort: number | null;
        isActive: boolean;
        telegramId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sipWsPort: number | null;
    }>;
    findByEmailWithRole(email: string): Promise<{
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
        isActive: boolean;
        telegramId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sipWsPort: number | null;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity>;
    remove(id: string): Promise<void>;
    toggleActive(id: string): Promise<UserEntity>;
}
