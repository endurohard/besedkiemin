import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserEntity } from "./entities/user.entity";
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<UserEntity>;
    findAll(): Promise<UserEntity[]>;
    findProductionWorkers(): Promise<UserEntity[]>;
    findOne(id: string): Promise<UserEntity>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity>;
    remove(id: string): Promise<{
        message: string;
    }>;
    toggleActive(id: string): Promise<UserEntity>;
}
