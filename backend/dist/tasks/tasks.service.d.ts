import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
export declare class TasksService {
    private prisma;
    private telegramService;
    constructor(prisma: PrismaService, telegramService: TelegramService);
    getMyTasks(userId: string): Promise<({
        product: {
            order: {
                id: string;
                orderNumber: string;
                customerName: string;
                priority: import(".prisma/client").$Enums.OrderPriority;
            };
            productType: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                productionTimeHours: number | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            quantity: number;
            orderId: string;
            name: string;
            description: string | null;
            dimensions: string | null;
            stage: import(".prisma/client").$Enums.ProductionStage;
            schemaImageUrl: string | null;
            deadline: Date | null;
            productTypeId: string;
        };
        assignedTo: {
            id: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        productId: string;
        description: string | null;
        title: string;
        stage: import(".prisma/client").$Enums.ProductionStage;
        priority: import(".prisma/client").$Enums.TaskPriority;
        acceptedAt: Date | null;
        completedAt: Date | null;
        passedAt: Date | null;
        rejectedAt: Date | null;
        notes: string | null;
        defectPhotos: string[];
        quantityProcessed: number;
        assignedToId: string;
        workflowStageId: string | null;
    })[]>;
    acceptTask(taskId: string, userId: string): Promise<{
        product: {
            order: {
                id: string;
                orderNumber: string;
                customerName: string;
                customerPhone: string | null;
                status: import(".prisma/client").$Enums.OrderStatus;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                priority: import(".prisma/client").$Enums.OrderPriority;
                notes: string | null;
                customerAddress: string | null;
                createdById: string;
            };
            productType: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                productionTimeHours: number | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            quantity: number;
            orderId: string;
            name: string;
            description: string | null;
            dimensions: string | null;
            stage: import(".prisma/client").$Enums.ProductionStage;
            schemaImageUrl: string | null;
            deadline: Date | null;
            productTypeId: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        productId: string;
        description: string | null;
        title: string;
        stage: import(".prisma/client").$Enums.ProductionStage;
        priority: import(".prisma/client").$Enums.TaskPriority;
        acceptedAt: Date | null;
        completedAt: Date | null;
        passedAt: Date | null;
        rejectedAt: Date | null;
        notes: string | null;
        defectPhotos: string[];
        quantityProcessed: number;
        assignedToId: string;
        workflowStageId: string | null;
    }>;
    completeTask(taskId: string, userId: string, notes?: string, quantity?: number): Promise<{
        product: {
            order: {
                id: string;
                orderNumber: string;
                customerName: string;
                customerPhone: string | null;
                status: import(".prisma/client").$Enums.OrderStatus;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                priority: import(".prisma/client").$Enums.OrderPriority;
                notes: string | null;
                customerAddress: string | null;
                createdById: string;
            };
            productType: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                productionTimeHours: number | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            quantity: number;
            orderId: string;
            name: string;
            description: string | null;
            dimensions: string | null;
            stage: import(".prisma/client").$Enums.ProductionStage;
            schemaImageUrl: string | null;
            deadline: Date | null;
            productTypeId: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        productId: string;
        description: string | null;
        title: string;
        stage: import(".prisma/client").$Enums.ProductionStage;
        priority: import(".prisma/client").$Enums.TaskPriority;
        acceptedAt: Date | null;
        completedAt: Date | null;
        passedAt: Date | null;
        rejectedAt: Date | null;
        notes: string | null;
        defectPhotos: string[];
        quantityProcessed: number;
        assignedToId: string;
        workflowStageId: string | null;
    }>;
    passTask(taskId: string, userId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        productId: string;
        description: string | null;
        title: string;
        stage: import(".prisma/client").$Enums.ProductionStage;
        priority: import(".prisma/client").$Enums.TaskPriority;
        acceptedAt: Date | null;
        completedAt: Date | null;
        passedAt: Date | null;
        rejectedAt: Date | null;
        notes: string | null;
        defectPhotos: string[];
        quantityProcessed: number;
        assignedToId: string;
        workflowStageId: string | null;
    }>;
    rejectTask(taskId: string, userId: string, notes: string, quantity?: number, defectPhotoUrl?: string, requestPhoto?: boolean, returnToStage?: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        productId: string;
        description: string | null;
        title: string;
        stage: import(".prisma/client").$Enums.ProductionStage;
        priority: import(".prisma/client").$Enums.TaskPriority;
        acceptedAt: Date | null;
        completedAt: Date | null;
        passedAt: Date | null;
        rejectedAt: Date | null;
        notes: string | null;
        defectPhotos: string[];
        quantityProcessed: number;
        assignedToId: string;
        workflowStageId: string | null;
    }>;
    approveTask(taskId: string, userId: string, quantity: number): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        productId: string;
        description: string | null;
        title: string;
        stage: import(".prisma/client").$Enums.ProductionStage;
        priority: import(".prisma/client").$Enums.TaskPriority;
        acceptedAt: Date | null;
        completedAt: Date | null;
        passedAt: Date | null;
        rejectedAt: Date | null;
        notes: string | null;
        defectPhotos: string[];
        quantityProcessed: number;
        assignedToId: string;
        workflowStageId: string | null;
    }>;
    private updateOrderStatus;
    getDefectsWithPhotos(): Promise<{
        defectPhotos: string[];
        product: {
            order: {
                id: string;
                orderNumber: string;
                customerName: string;
                customerPhone: string | null;
                status: import(".prisma/client").$Enums.OrderStatus;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                priority: import(".prisma/client").$Enums.OrderPriority;
                notes: string | null;
                customerAddress: string | null;
                createdById: string;
            };
            productType: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                productionTimeHours: number | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            quantity: number;
            orderId: string;
            name: string;
            description: string | null;
            dimensions: string | null;
            stage: import(".prisma/client").$Enums.ProductionStage;
            schemaImageUrl: string | null;
            deadline: Date | null;
            productTypeId: string;
        };
        checkedBy: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            telegramId: string | null;
            sipServer: string | null;
            sipUser: string | null;
            sipPassword: string | null;
            sipPort: number | null;
            sipWsPort: number | null;
        };
        id: string;
        status: import(".prisma/client").$Enums.QualityStatus;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        notes: string | null;
        photoUrl: string | null;
        checkedAt: Date | null;
        checkedById: string | null;
    }[]>;
    acceptDefectRework(productId: string, userId: string): Promise<{
        product: {
            order: {
                id: string;
                orderNumber: string;
                customerName: string;
                customerPhone: string | null;
                status: import(".prisma/client").$Enums.OrderStatus;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                priority: import(".prisma/client").$Enums.OrderPriority;
                notes: string | null;
                customerAddress: string | null;
                createdById: string;
            };
            productType: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                productionTimeHours: number | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            quantity: number;
            orderId: string;
            name: string;
            description: string | null;
            dimensions: string | null;
            stage: import(".prisma/client").$Enums.ProductionStage;
            schemaImageUrl: string | null;
            deadline: Date | null;
            productTypeId: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        productId: string;
        description: string | null;
        title: string;
        stage: import(".prisma/client").$Enums.ProductionStage;
        priority: import(".prisma/client").$Enums.TaskPriority;
        acceptedAt: Date | null;
        completedAt: Date | null;
        passedAt: Date | null;
        rejectedAt: Date | null;
        notes: string | null;
        defectPhotos: string[];
        quantityProcessed: number;
        assignedToId: string;
        workflowStageId: string | null;
    }>;
    getUnacceptedDefectsCount(userId: string): Promise<{
        count: number;
    }>;
}
