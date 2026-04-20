import { OrderSourcesService } from "./order-sources.service";
import { CreateOrderSourceDto, UpdateOrderSourceDto } from "./dto";
export declare class OrderSourcesController {
    private readonly orderSourcesService;
    constructor(orderSourcesService: OrderSourcesService);
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
    initialize(): Promise<{
        success: boolean;
        message: string;
    }>;
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
}
