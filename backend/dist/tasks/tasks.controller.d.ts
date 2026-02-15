import { TasksService } from './tasks.service';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    getMyTasks(req: any): Promise<({
        product: {
            productType: {
                id: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                productionTimeHours: number | null;
                requiresSewing: boolean;
            };
            order: {
                id: string;
                orderNumber: string;
                customerName: string;
                priority: import(".prisma/client").$Enums.OrderPriority;
            };
        } & {
            id: string;
            productTypeId: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            requiresSewing: boolean | null;
            dimensions: string | null;
            color: string | null;
            upholsteryMaterial: string | null;
            quantity: number;
            schemaImageUrl: string | null;
            deadline: Date | null;
            orderId: string;
        };
        assignedTo: {
            id: string;
            firstName: string;
            lastName: string;
            role: {
                name: string;
                code: string;
            };
        };
    } & {
        id: string;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        notes: string | null;
        quantity: number;
        status: import(".prisma/client").$Enums.TaskStatus;
        completedAt: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        title: string;
        acceptedAt: Date | null;
        passedAt: Date | null;
        rejectedAt: Date | null;
        defectPhotos: string[];
        quantityProcessed: number;
        assignedToId: string;
    })[]>;
    getDefects(req: any): Promise<{
        product: {
            qualityChecks: any;
            productType: {
                id: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                productionTimeHours: number | null;
                requiresSewing: boolean;
            };
            order: {
                id: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                createdById: string;
                notes: string | null;
                totalAmount: number | null;
                status: import(".prisma/client").$Enums.OrderStatus;
                orderNumber: string;
                customerName: string;
                customerPhone: string | null;
                customerAddress: string | null;
                priority: import(".prisma/client").$Enums.OrderPriority;
                sourceId: string | null;
            };
            id: string;
            productTypeId: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            requiresSewing: boolean | null;
            dimensions: string | null;
            color: string | null;
            upholsteryMaterial: string | null;
            quantity: number;
            schemaImageUrl: string | null;
            deadline: Date | null;
            orderId: string;
        };
        defectPhotos: string[];
        checkedBy: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            roleId: string;
            telegramId: string | null;
            sipServer: string | null;
            sipUser: string | null;
            sipPassword: string | null;
            sipPort: number | null;
            sipWsPort: number | null;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        notes: string | null;
        status: import(".prisma/client").$Enums.QualityStatus;
        checkedAt: Date | null;
        photoUrl: string | null;
        checkedById: string | null;
    }[]>;
    getUnacceptedDefectsCount(req: any): Promise<{
        count: number;
    }>;
    acceptDefectRework(productId: string, req: any): Promise<{
        product: {
            productType: {
                id: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                productionTimeHours: number | null;
                requiresSewing: boolean;
            };
            order: {
                id: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                createdById: string;
                notes: string | null;
                totalAmount: number | null;
                status: import(".prisma/client").$Enums.OrderStatus;
                orderNumber: string;
                customerName: string;
                customerPhone: string | null;
                customerAddress: string | null;
                priority: import(".prisma/client").$Enums.OrderPriority;
                sourceId: string | null;
            };
        } & {
            id: string;
            productTypeId: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            requiresSewing: boolean | null;
            dimensions: string | null;
            color: string | null;
            upholsteryMaterial: string | null;
            quantity: number;
            schemaImageUrl: string | null;
            deadline: Date | null;
            orderId: string;
        };
    } & {
        id: string;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        notes: string | null;
        quantity: number;
        status: import(".prisma/client").$Enums.TaskStatus;
        completedAt: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        title: string;
        acceptedAt: Date | null;
        passedAt: Date | null;
        rejectedAt: Date | null;
        defectPhotos: string[];
        quantityProcessed: number;
        assignedToId: string;
    }>;
    getDepartmentWorkers(req: any): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        role: {
            id: string;
            name: string;
            code: string;
        };
    }[]>;
    getDepartmentTasks(req: any): Promise<{
        worker: {
            id: string;
            firstName: string;
            lastName: string;
            isCurrentUser: boolean;
        };
        tasks: ({
            product: {
                productType: {
                    id: string;
                    description: string | null;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    productionTimeHours: number | null;
                    requiresSewing: boolean;
                };
                order: {
                    id: string;
                    orderNumber: string;
                    priority: import(".prisma/client").$Enums.OrderPriority;
                };
            } & {
                id: string;
                productTypeId: string;
                stage: import(".prisma/client").$Enums.ProductionStage;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                requiresSewing: boolean | null;
                dimensions: string | null;
                color: string | null;
                upholsteryMaterial: string | null;
                quantity: number;
                schemaImageUrl: string | null;
                deadline: Date | null;
                orderId: string;
            };
            assignedTo: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            workflowStageId: string | null;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            notes: string | null;
            quantity: number;
            status: import(".prisma/client").$Enums.TaskStatus;
            completedAt: Date | null;
            priority: import(".prisma/client").$Enums.TaskPriority;
            title: string;
            acceptedAt: Date | null;
            passedAt: Date | null;
            rejectedAt: Date | null;
            defectPhotos: string[];
            quantityProcessed: number;
            assignedToId: string;
        })[];
    }[]>;
    acceptTask(id: string, selectedUserId: string, quantity: number, req: any): Promise<{
        product: {
            productType: {
                id: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                productionTimeHours: number | null;
                requiresSewing: boolean;
            };
            order: {
                id: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                createdById: string;
                notes: string | null;
                totalAmount: number | null;
                status: import(".prisma/client").$Enums.OrderStatus;
                orderNumber: string;
                customerName: string;
                customerPhone: string | null;
                customerAddress: string | null;
                priority: import(".prisma/client").$Enums.OrderPriority;
                sourceId: string | null;
            };
        } & {
            id: string;
            productTypeId: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            requiresSewing: boolean | null;
            dimensions: string | null;
            color: string | null;
            upholsteryMaterial: string | null;
            quantity: number;
            schemaImageUrl: string | null;
            deadline: Date | null;
            orderId: string;
        };
    } & {
        id: string;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        notes: string | null;
        quantity: number;
        status: import(".prisma/client").$Enums.TaskStatus;
        completedAt: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        title: string;
        acceptedAt: Date | null;
        passedAt: Date | null;
        rejectedAt: Date | null;
        defectPhotos: string[];
        quantityProcessed: number;
        assignedToId: string;
    }>;
    completeTask(id: string, notes: string, quantity: number, req: any): Promise<{
        product: {
            productType: {
                id: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                productionTimeHours: number | null;
                requiresSewing: boolean;
            };
            order: {
                id: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                createdById: string;
                notes: string | null;
                totalAmount: number | null;
                status: import(".prisma/client").$Enums.OrderStatus;
                orderNumber: string;
                customerName: string;
                customerPhone: string | null;
                customerAddress: string | null;
                priority: import(".prisma/client").$Enums.OrderPriority;
                sourceId: string | null;
            };
        } & {
            id: string;
            productTypeId: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            requiresSewing: boolean | null;
            dimensions: string | null;
            color: string | null;
            upholsteryMaterial: string | null;
            quantity: number;
            schemaImageUrl: string | null;
            deadline: Date | null;
            orderId: string;
        };
    } & {
        id: string;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        notes: string | null;
        quantity: number;
        status: import(".prisma/client").$Enums.TaskStatus;
        completedAt: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        title: string;
        acceptedAt: Date | null;
        passedAt: Date | null;
        rejectedAt: Date | null;
        defectPhotos: string[];
        quantityProcessed: number;
        assignedToId: string;
    }>;
    passTask(id: string, req: any): Promise<{
        id: string;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        notes: string | null;
        quantity: number;
        status: import(".prisma/client").$Enums.TaskStatus;
        completedAt: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        title: string;
        acceptedAt: Date | null;
        passedAt: Date | null;
        rejectedAt: Date | null;
        defectPhotos: string[];
        quantityProcessed: number;
        assignedToId: string;
    }>;
    rejectTask(id: string, notes: string, quantity: number, defectPhotoUrl: string, requestPhoto: boolean, returnToStage: string, req: any): Promise<{
        id: string;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        notes: string | null;
        quantity: number;
        status: import(".prisma/client").$Enums.TaskStatus;
        completedAt: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        title: string;
        acceptedAt: Date | null;
        passedAt: Date | null;
        rejectedAt: Date | null;
        defectPhotos: string[];
        quantityProcessed: number;
        assignedToId: string;
    }>;
    approveTask(id: string, quantity: number, req: any): Promise<{
        id: string;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        notes: string | null;
        quantity: number;
        status: import(".prisma/client").$Enums.TaskStatus;
        completedAt: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        title: string;
        acceptedAt: Date | null;
        passedAt: Date | null;
        rejectedAt: Date | null;
        defectPhotos: string[];
        quantityProcessed: number;
        assignedToId: string;
    }>;
}
