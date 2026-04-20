import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderSourceDto, UpdateOrderSourceDto } from "./dto";
export declare class OrderSourcesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        _count: {
            orders: number;
        };
    } & {
        order: number;
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        code: string;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
    })[]>;
    findActive(): Promise<{
        order: number;
        name: string;
        description: string | null;
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
        order: number;
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        code: string;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
    }>;
    findByCode(code: string): Promise<{
        order: number;
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        code: string;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
    } | null>;
    create(dto: CreateOrderSourceDto): Promise<{
        order: number;
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        code: string;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
    }>;
    update(id: string, dto: UpdateOrderSourceDto): Promise<{
        order: number;
        name: string;
        description: string | null;
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
