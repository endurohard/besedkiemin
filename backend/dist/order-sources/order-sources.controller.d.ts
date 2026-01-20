import { OrderSourcesService } from './order-sources.service';
import { CreateOrderSourceDto, UpdateOrderSourceDto } from './dto';
export declare class OrderSourcesController {
    private readonly orderSourcesService;
    constructor(orderSourcesService: OrderSourcesService);
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
    initialize(): Promise<{
        success: boolean;
        message: string;
    }>;
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
}
