import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderSourceDto, UpdateOrderSourceDto } from './dto';
export declare class OrderSourcesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        _count: {
            orders: number;
        };
    } & {
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        code: string;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
    })[]>;
    findActive(): Promise<{
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        code: string;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
    }[]>;
    findOne(id: string): Promise<{
        _count: {
            orders: number;
        };
    } & {
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        code: string;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
    }>;
    findByCode(code: string): Promise<{
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        code: string;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
    }>;
    create(dto: CreateOrderSourceDto): Promise<{
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        code: string;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
    }>;
    update(id: string, dto: UpdateOrderSourceDto): Promise<{
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        code: string;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    initializeDefaultSources(): Promise<{
        success: boolean;
        message: string;
    }>;
}
