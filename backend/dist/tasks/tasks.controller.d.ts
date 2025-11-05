import { TasksService } from './tasks.service';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    getMyTasks(req: any): Promise<({
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
    getDefects(): Promise<{
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
    getUnacceptedDefectsCount(req: any): Promise<{
        count: number;
    }>;
    acceptDefectRework(productId: string, req: any): Promise<{
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
    acceptTask(id: string, req: any): Promise<{
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
    completeTask(id: string, notes: string, quantity: number, req: any): Promise<{
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
    passTask(id: string, req: any): Promise<{
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
    rejectTask(id: string, notes: string, quantity: number, defectPhotoUrl: string, requestPhoto: boolean, returnToStage: string, req: any): Promise<{
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
    approveTask(id: string, quantity: number, req: any): Promise<{
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
}
