import { PrismaService } from '../prisma/prisma.service';
import { PayrollStatus, ProductionStage } from '@prisma/client';
import { CreateWorkRateDto, UpdateWorkRateDto, CreatePenaltyDto, UpdatePenaltyDto, CalculatePayrollDto, CreateManagerCommissionDto, UpdateManagerCommissionDto } from './dto';
export declare class PayrollService {
    private prisma;
    constructor(prisma: PrismaService);
    findAllWorkRates(): Promise<({
        productType: {
            description: string | null;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            requiresSewing: boolean;
            productionTimeHours: number | null;
        };
        workflowStage: {
            description: string | null;
            order: number;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
        };
    } & {
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        productTypeId: string;
        pricePerUnit: number;
    })[]>;
    findActiveWorkRates(): Promise<({
        productType: {
            description: string | null;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            requiresSewing: boolean;
            productionTimeHours: number | null;
        };
        workflowStage: {
            description: string | null;
            order: number;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
        };
    } & {
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        productTypeId: string;
        pricePerUnit: number;
    })[]>;
    findWorkRate(productTypeId: string, stage: ProductionStage): Promise<{
        productType: {
            description: string | null;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            requiresSewing: boolean;
            productionTimeHours: number | null;
        };
        workflowStage: {
            description: string | null;
            order: number;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
        };
    } & {
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        productTypeId: string;
        pricePerUnit: number;
    }>;
    createWorkRate(dto: CreateWorkRateDto): Promise<{
        productType: {
            description: string | null;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            requiresSewing: boolean;
            productionTimeHours: number | null;
        };
        workflowStage: {
            description: string | null;
            order: number;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
        };
    } & {
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        productTypeId: string;
        pricePerUnit: number;
    }>;
    updateWorkRate(id: string, dto: UpdateWorkRateDto): Promise<{
        productType: {
            description: string | null;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            requiresSewing: boolean;
            productionTimeHours: number | null;
        };
        workflowStage: {
            description: string | null;
            order: number;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
        };
    } & {
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        productTypeId: string;
        pricePerUnit: number;
    }>;
    deleteWorkRate(id: string): Promise<{
        success: boolean;
    }>;
    findAllPenalties(filters?: {
        userId?: string;
        startDate?: string;
        endDate?: string;
        includeCancelled?: boolean;
    }): Promise<({
        user: {
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
            firstName: string;
            lastName: string;
            id: string;
        };
        product: {
            productType: {
                description: string | null;
                name: string;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                requiresSewing: boolean;
                productionTimeHours: number | null;
            };
            name: string;
            id: string;
        };
        createdBy: {
            firstName: string;
            lastName: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        productId: string | null;
        createdById: string;
        userId: string;
        reason: string;
        amount: number;
        date: Date;
        isCancelled: boolean;
        cancelledAt: Date | null;
        cancelledById: string | null;
        payrollPeriodId: string | null;
    })[]>;
    createPenalty(dto: CreatePenaltyDto, createdById: string): Promise<{
        user: {
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
            firstName: string;
            lastName: string;
            id: string;
        };
        product: {
            description: string | null;
            name: string;
            id: string;
            color: string | null;
            createdAt: Date;
            updatedAt: Date;
            stage: import(".prisma/client").$Enums.ProductionStage;
            quantity: number;
            productTypeId: string;
            orderId: string;
            dimensions: string | null;
            schemaImageUrl: string | null;
            deadline: Date | null;
            requiresSewing: boolean | null;
            upholsteryMaterial: string | null;
        };
        createdBy: {
            firstName: string;
            lastName: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        productId: string | null;
        createdById: string;
        userId: string;
        reason: string;
        amount: number;
        date: Date;
        isCancelled: boolean;
        cancelledAt: Date | null;
        cancelledById: string | null;
        payrollPeriodId: string | null;
    }>;
    updatePenalty(id: string, dto: UpdatePenaltyDto): Promise<{
        user: {
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
        };
        product: {
            description: string | null;
            name: string;
            id: string;
            color: string | null;
            createdAt: Date;
            updatedAt: Date;
            stage: import(".prisma/client").$Enums.ProductionStage;
            quantity: number;
            productTypeId: string;
            orderId: string;
            dimensions: string | null;
            schemaImageUrl: string | null;
            deadline: Date | null;
            requiresSewing: boolean | null;
            upholsteryMaterial: string | null;
        };
        createdBy: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        productId: string | null;
        createdById: string;
        userId: string;
        reason: string;
        amount: number;
        date: Date;
        isCancelled: boolean;
        cancelledAt: Date | null;
        cancelledById: string | null;
        payrollPeriodId: string | null;
    }>;
    cancelPenalty(id: string, cancelledById: string, notes?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        productId: string | null;
        createdById: string;
        userId: string;
        reason: string;
        amount: number;
        date: Date;
        isCancelled: boolean;
        cancelledAt: Date | null;
        cancelledById: string | null;
        payrollPeriodId: string | null;
    }>;
    findAllManagerCommissions(): Promise<({
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
        user: {
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
            firstName: string;
            lastName: string;
            id: string;
        };
    } & {
        roleId: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        baseSalary: number;
        commissionPercent: number;
        minOrderAmount: number | null;
    })[]>;
    findManagerCommission(userId: string): Promise<{
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
        user: {
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
        };
    } & {
        roleId: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        baseSalary: number;
        commissionPercent: number;
        minOrderAmount: number | null;
    }>;
    createManagerCommission(dto: CreateManagerCommissionDto): Promise<{
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
        user: {
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
        };
    } & {
        roleId: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        baseSalary: number;
        commissionPercent: number;
        minOrderAmount: number | null;
    }>;
    updateManagerCommission(id: string, dto: UpdateManagerCommissionDto): Promise<{
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
        user: {
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
        };
    } & {
        roleId: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        baseSalary: number;
        commissionPercent: number;
        minOrderAmount: number | null;
    }>;
    deleteManagerCommission(id: string): Promise<{
        success: boolean;
    }>;
    findAllPayrollPeriods(filters?: {
        userId?: string;
        status?: PayrollStatus;
        periodStart?: string;
        periodEnd?: string;
    }): Promise<({
        user: {
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
            firstName: string;
            lastName: string;
            id: string;
        };
        workLogs: ({
            productType: {
                description: string | null;
                name: string;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                requiresSewing: boolean;
                productionTimeHours: number | null;
            };
            product: {
                description: string | null;
                name: string;
                id: string;
                color: string | null;
                createdAt: Date;
                updatedAt: Date;
                stage: import(".prisma/client").$Enums.ProductionStage;
                quantity: number;
                productTypeId: string;
                orderId: string;
                dimensions: string | null;
                schemaImageUrl: string | null;
                deadline: Date | null;
                requiresSewing: boolean | null;
                upholsteryMaterial: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stage: import(".prisma/client").$Enums.ProductionStage;
            quantity: number;
            completedAt: Date;
            notes: string | null;
            productId: string;
            workflowStageId: string | null;
            totalAmount: number;
            productTypeId: string;
            userId: string;
            pricePerUnit: number;
            payrollPeriodId: string | null;
            taskId: string | null;
        })[];
        penalties: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            productId: string | null;
            createdById: string;
            userId: string;
            reason: string;
            amount: number;
            date: Date;
            isCancelled: boolean;
            cancelledAt: Date | null;
            cancelledById: string | null;
            payrollPeriodId: string | null;
        }[];
    } & {
        status: import(".prisma/client").$Enums.PayrollStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        totalAmount: number;
        userId: string;
        periodStart: Date;
        periodEnd: Date;
        baseSalary: number;
        workAmount: number;
        commissionAmount: number;
        ordersAmount: number;
        penaltyAmount: number;
        approvedById: string | null;
        approvedAt: Date | null;
        paidById: string | null;
        paidAt: Date | null;
    })[]>;
    findPayrollPeriod(id: string): Promise<{
        user: {
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
            firstName: string;
            lastName: string;
            id: string;
        };
        workLogs: ({
            productType: {
                description: string | null;
                name: string;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                requiresSewing: boolean;
                productionTimeHours: number | null;
            };
            product: {
                order: {
                    status: import(".prisma/client").$Enums.OrderStatus;
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    priority: import(".prisma/client").$Enums.OrderPriority;
                    notes: string | null;
                    orderNumber: string;
                    customerName: string;
                    customerPhone: string | null;
                    customerAddress: string | null;
                    sourceId: string | null;
                    totalAmount: number | null;
                    createdById: string;
                };
            } & {
                description: string | null;
                name: string;
                id: string;
                color: string | null;
                createdAt: Date;
                updatedAt: Date;
                stage: import(".prisma/client").$Enums.ProductionStage;
                quantity: number;
                productTypeId: string;
                orderId: string;
                dimensions: string | null;
                schemaImageUrl: string | null;
                deadline: Date | null;
                requiresSewing: boolean | null;
                upholsteryMaterial: string | null;
            };
            task: {
                status: import(".prisma/client").$Enums.TaskStatus;
                description: string | null;
                title: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                stage: import(".prisma/client").$Enums.ProductionStage;
                quantity: number;
                priority: import(".prisma/client").$Enums.TaskPriority;
                acceptedAt: Date | null;
                completedAt: Date | null;
                passedAt: Date | null;
                rejectedAt: Date | null;
                notes: string | null;
                defectPhotos: string[];
                quantityProcessed: number;
                productId: string;
                assignedToId: string;
                workflowStageId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stage: import(".prisma/client").$Enums.ProductionStage;
            quantity: number;
            completedAt: Date;
            notes: string | null;
            productId: string;
            workflowStageId: string | null;
            totalAmount: number;
            productTypeId: string;
            userId: string;
            pricePerUnit: number;
            payrollPeriodId: string | null;
            taskId: string | null;
        })[];
        penalties: ({
            product: {
                description: string | null;
                name: string;
                id: string;
                color: string | null;
                createdAt: Date;
                updatedAt: Date;
                stage: import(".prisma/client").$Enums.ProductionStage;
                quantity: number;
                productTypeId: string;
                orderId: string;
                dimensions: string | null;
                schemaImageUrl: string | null;
                deadline: Date | null;
                requiresSewing: boolean | null;
                upholsteryMaterial: string | null;
            };
            createdBy: {
                firstName: string;
                lastName: string;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            productId: string | null;
            createdById: string;
            userId: string;
            reason: string;
            amount: number;
            date: Date;
            isCancelled: boolean;
            cancelledAt: Date | null;
            cancelledById: string | null;
            payrollPeriodId: string | null;
        })[];
    } & {
        status: import(".prisma/client").$Enums.PayrollStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        totalAmount: number;
        userId: string;
        periodStart: Date;
        periodEnd: Date;
        baseSalary: number;
        workAmount: number;
        commissionAmount: number;
        ordersAmount: number;
        penaltyAmount: number;
        approvedById: string | null;
        approvedAt: Date | null;
        paidById: string | null;
        paidAt: Date | null;
    }>;
    calculatePayrollForUser(userId: string, periodStart: Date, periodEnd: Date): Promise<{
        user: {
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
            firstName: string;
            lastName: string;
            id: string;
        };
        workLogs: ({
            productType: {
                description: string | null;
                name: string;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                requiresSewing: boolean;
                productionTimeHours: number | null;
            };
            product: {
                order: {
                    status: import(".prisma/client").$Enums.OrderStatus;
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    priority: import(".prisma/client").$Enums.OrderPriority;
                    notes: string | null;
                    orderNumber: string;
                    customerName: string;
                    customerPhone: string | null;
                    customerAddress: string | null;
                    sourceId: string | null;
                    totalAmount: number | null;
                    createdById: string;
                };
            } & {
                description: string | null;
                name: string;
                id: string;
                color: string | null;
                createdAt: Date;
                updatedAt: Date;
                stage: import(".prisma/client").$Enums.ProductionStage;
                quantity: number;
                productTypeId: string;
                orderId: string;
                dimensions: string | null;
                schemaImageUrl: string | null;
                deadline: Date | null;
                requiresSewing: boolean | null;
                upholsteryMaterial: string | null;
            };
            task: {
                status: import(".prisma/client").$Enums.TaskStatus;
                description: string | null;
                title: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                stage: import(".prisma/client").$Enums.ProductionStage;
                quantity: number;
                priority: import(".prisma/client").$Enums.TaskPriority;
                acceptedAt: Date | null;
                completedAt: Date | null;
                passedAt: Date | null;
                rejectedAt: Date | null;
                notes: string | null;
                defectPhotos: string[];
                quantityProcessed: number;
                productId: string;
                assignedToId: string;
                workflowStageId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stage: import(".prisma/client").$Enums.ProductionStage;
            quantity: number;
            completedAt: Date;
            notes: string | null;
            productId: string;
            workflowStageId: string | null;
            totalAmount: number;
            productTypeId: string;
            userId: string;
            pricePerUnit: number;
            payrollPeriodId: string | null;
            taskId: string | null;
        })[];
        penalties: ({
            product: {
                description: string | null;
                name: string;
                id: string;
                color: string | null;
                createdAt: Date;
                updatedAt: Date;
                stage: import(".prisma/client").$Enums.ProductionStage;
                quantity: number;
                productTypeId: string;
                orderId: string;
                dimensions: string | null;
                schemaImageUrl: string | null;
                deadline: Date | null;
                requiresSewing: boolean | null;
                upholsteryMaterial: string | null;
            };
            createdBy: {
                firstName: string;
                lastName: string;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            productId: string | null;
            createdById: string;
            userId: string;
            reason: string;
            amount: number;
            date: Date;
            isCancelled: boolean;
            cancelledAt: Date | null;
            cancelledById: string | null;
            payrollPeriodId: string | null;
        })[];
    } & {
        status: import(".prisma/client").$Enums.PayrollStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        totalAmount: number;
        userId: string;
        periodStart: Date;
        periodEnd: Date;
        baseSalary: number;
        workAmount: number;
        commissionAmount: number;
        ordersAmount: number;
        penaltyAmount: number;
        approvedById: string | null;
        approvedAt: Date | null;
        paidById: string | null;
        paidAt: Date | null;
    }>;
    calculatePayrollForAll(dto: CalculatePayrollDto): Promise<any[]>;
    approvePayrollPeriod(id: string, approvedById: string, notes?: string): Promise<{
        user: {
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
        };
    } & {
        status: import(".prisma/client").$Enums.PayrollStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        totalAmount: number;
        userId: string;
        periodStart: Date;
        periodEnd: Date;
        baseSalary: number;
        workAmount: number;
        commissionAmount: number;
        ordersAmount: number;
        penaltyAmount: number;
        approvedById: string | null;
        approvedAt: Date | null;
        paidById: string | null;
        paidAt: Date | null;
    }>;
    markPayrollAsPaid(id: string, paidById: string, notes?: string): Promise<{
        user: {
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
        };
    } & {
        status: import(".prisma/client").$Enums.PayrollStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        totalAmount: number;
        userId: string;
        periodStart: Date;
        periodEnd: Date;
        baseSalary: number;
        workAmount: number;
        commissionAmount: number;
        ordersAmount: number;
        penaltyAmount: number;
        approvedById: string | null;
        approvedAt: Date | null;
        paidById: string | null;
        paidAt: Date | null;
    }>;
    cancelPayrollPeriod(id: string): Promise<{
        success: boolean;
    }>;
    deletePayrollPeriod(id: string): Promise<{
        success: boolean;
    }>;
    createWorkLog(data: {
        userId: string;
        productId: string;
        taskId?: string;
        productTypeId: string;
        stage: ProductionStage;
        workflowStageId?: string;
        quantity: number;
        completedAt: Date;
        notes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stage: import(".prisma/client").$Enums.ProductionStage;
        quantity: number;
        completedAt: Date;
        notes: string | null;
        productId: string;
        workflowStageId: string | null;
        totalAmount: number;
        productTypeId: string;
        userId: string;
        pricePerUnit: number;
        payrollPeriodId: string | null;
        taskId: string | null;
    }>;
    findWorkLogs(filters?: {
        userId?: string;
        productTypeId?: string;
        stage?: ProductionStage;
        startDate?: string;
        endDate?: string;
        unassigned?: boolean;
    }): Promise<({
        user: {
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
            firstName: string;
            lastName: string;
            id: string;
        };
        productType: {
            description: string | null;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            requiresSewing: boolean;
            productionTimeHours: number | null;
        };
        product: {
            order: {
                id: string;
                orderNumber: string;
                customerName: string;
            };
        } & {
            description: string | null;
            name: string;
            id: string;
            color: string | null;
            createdAt: Date;
            updatedAt: Date;
            stage: import(".prisma/client").$Enums.ProductionStage;
            quantity: number;
            productTypeId: string;
            orderId: string;
            dimensions: string | null;
            schemaImageUrl: string | null;
            deadline: Date | null;
            requiresSewing: boolean | null;
            upholsteryMaterial: string | null;
        };
        task: {
            status: import(".prisma/client").$Enums.TaskStatus;
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stage: import(".prisma/client").$Enums.ProductionStage;
            quantity: number;
            priority: import(".prisma/client").$Enums.TaskPriority;
            acceptedAt: Date | null;
            completedAt: Date | null;
            passedAt: Date | null;
            rejectedAt: Date | null;
            notes: string | null;
            defectPhotos: string[];
            quantityProcessed: number;
            productId: string;
            assignedToId: string;
            workflowStageId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stage: import(".prisma/client").$Enums.ProductionStage;
        quantity: number;
        completedAt: Date;
        notes: string | null;
        productId: string;
        workflowStageId: string | null;
        totalAmount: number;
        productTypeId: string;
        userId: string;
        pricePerUnit: number;
        payrollPeriodId: string | null;
        taskId: string | null;
    })[]>;
    getPayrollSummary(periodStart: string, periodEnd: string): Promise<{
        period: {
            start: string;
            end: string;
        };
        totals: {
            workAmount: number;
            commissionAmount: number;
            penaltyAmount: number;
            totalAmount: number;
        };
        users: {
            userId: string;
            userName: string;
            role: string;
            workAmount: number;
            commissionAmount: number;
            penaltyAmount: number;
            totalAmount: number;
            workLogsCount: number;
        }[];
    }>;
}
