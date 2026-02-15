import { PayrollService } from './payroll.service';
import { CreateWorkRateDto, UpdateWorkRateDto, CreatePenaltyDto, UpdatePenaltyDto, CancelPenaltyDto, CalculatePayrollDto, CreateManagerCommissionDto, UpdateManagerCommissionDto } from './dto';
import { PayrollStatus, ProductionStage } from '@prisma/client';
export declare class PayrollController {
    private readonly payrollService;
    constructor(payrollService: PayrollService);
    findAllWorkRates(): Promise<({
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
        nomenclature: {
            id: string;
            productTypeId: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            productionTimeHours: number | null;
            sku: string | null;
            dimensions: string | null;
            materials: string | null;
            color: string | null;
            upholsteryMaterial: string | null;
            weight: number | null;
            basePrice: number | null;
            discontinuedAt: Date | null;
        };
        workflowStage: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            order: number;
            legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
        };
    } & {
        id: string;
        productTypeId: string | null;
        nomenclatureId: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        pricePerUnit: number;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findActiveWorkRates(): Promise<({
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
        nomenclature: {
            id: string;
            productTypeId: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            productionTimeHours: number | null;
            sku: string | null;
            dimensions: string | null;
            materials: string | null;
            color: string | null;
            upholsteryMaterial: string | null;
            weight: number | null;
            basePrice: number | null;
            discontinuedAt: Date | null;
        };
        workflowStage: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            order: number;
            legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
        };
    } & {
        id: string;
        productTypeId: string | null;
        nomenclatureId: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        pricePerUnit: number;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findWorkRate(productTypeId: string, stage: ProductionStage): Promise<{
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
        workflowStage: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            order: number;
            legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
        };
    } & {
        id: string;
        productTypeId: string | null;
        nomenclatureId: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        pricePerUnit: number;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createWorkRate(dto: CreateWorkRateDto): Promise<{
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
        nomenclature: {
            id: string;
            productTypeId: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            productionTimeHours: number | null;
            sku: string | null;
            dimensions: string | null;
            materials: string | null;
            color: string | null;
            upholsteryMaterial: string | null;
            weight: number | null;
            basePrice: number | null;
            discontinuedAt: Date | null;
        };
        workflowStage: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            order: number;
            legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
        };
    } & {
        id: string;
        productTypeId: string | null;
        nomenclatureId: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        pricePerUnit: number;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateWorkRate(id: string, dto: UpdateWorkRateDto): Promise<{
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
        workflowStage: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            order: number;
            legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
        };
    } & {
        id: string;
        productTypeId: string | null;
        nomenclatureId: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        pricePerUnit: number;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteWorkRate(id: string): Promise<{
        success: boolean;
    }>;
    findAllPenalties(userId?: string, startDate?: string, endDate?: string, includeCancelled?: string): Promise<({
        user: {
            id: string;
            firstName: string;
            lastName: string;
            role: {
                id: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                color: string | null;
                order: number;
                code: string;
                isSystem: boolean;
                permissions: import("@prisma/client/runtime/library").JsonValue;
            };
        };
        product: {
            id: string;
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
            name: string;
        };
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        amount: number;
        reason: string;
        productId: string | null;
        createdById: string;
        date: Date;
        notes: string | null;
        isCancelled: boolean;
        cancelledAt: Date | null;
        cancelledById: string | null;
        payrollPeriodId: string | null;
    })[]>;
    createPenalty(dto: CreatePenaltyDto, req: any): Promise<{
        user: {
            id: string;
            firstName: string;
            lastName: string;
            role: {
                id: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                color: string | null;
                order: number;
                code: string;
                isSystem: boolean;
                permissions: import("@prisma/client/runtime/library").JsonValue;
            };
        };
        product: {
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
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        amount: number;
        reason: string;
        productId: string | null;
        createdById: string;
        date: Date;
        notes: string | null;
        isCancelled: boolean;
        cancelledAt: Date | null;
        cancelledById: string | null;
        payrollPeriodId: string | null;
    }>;
    updatePenalty(id: string, dto: UpdatePenaltyDto): Promise<{
        user: {
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
        product: {
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
        createdBy: {
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
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        amount: number;
        reason: string;
        productId: string | null;
        createdById: string;
        date: Date;
        notes: string | null;
        isCancelled: boolean;
        cancelledAt: Date | null;
        cancelledById: string | null;
        payrollPeriodId: string | null;
    }>;
    cancelPenalty(id: string, dto: CancelPenaltyDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        amount: number;
        reason: string;
        productId: string | null;
        createdById: string;
        date: Date;
        notes: string | null;
        isCancelled: boolean;
        cancelledAt: Date | null;
        cancelledById: string | null;
        payrollPeriodId: string | null;
    }>;
    findAllManagerCommissions(): Promise<({
        user: {
            id: string;
            firstName: string;
            lastName: string;
            role: {
                id: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                color: string | null;
                order: number;
                code: string;
                isSystem: boolean;
                permissions: import("@prisma/client/runtime/library").JsonValue;
            };
        };
        role: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            color: string | null;
            order: number;
            code: string;
            isSystem: boolean;
            permissions: import("@prisma/client/runtime/library").JsonValue;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        roleId: string | null;
        baseSalary: number;
        commissionPercent: number;
        minOrderAmount: number | null;
    })[]>;
    findManagerCommission(userId: string): Promise<{
        user: {
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
        role: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            color: string | null;
            order: number;
            code: string;
            isSystem: boolean;
            permissions: import("@prisma/client/runtime/library").JsonValue;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        roleId: string | null;
        baseSalary: number;
        commissionPercent: number;
        minOrderAmount: number | null;
    }>;
    createManagerCommission(dto: CreateManagerCommissionDto): Promise<{
        user: {
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
        role: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            color: string | null;
            order: number;
            code: string;
            isSystem: boolean;
            permissions: import("@prisma/client/runtime/library").JsonValue;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        roleId: string | null;
        baseSalary: number;
        commissionPercent: number;
        minOrderAmount: number | null;
    }>;
    updateManagerCommission(id: string, dto: UpdateManagerCommissionDto): Promise<{
        user: {
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
        role: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            color: string | null;
            order: number;
            code: string;
            isSystem: boolean;
            permissions: import("@prisma/client/runtime/library").JsonValue;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        roleId: string | null;
        baseSalary: number;
        commissionPercent: number;
        minOrderAmount: number | null;
    }>;
    deleteManagerCommission(id: string): Promise<{
        success: boolean;
    }>;
    findAllPayrollPeriods(userId?: string, status?: PayrollStatus, periodStart?: string, periodEnd?: string): Promise<({
        workLogs: ({
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
            product: {
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
            productTypeId: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            workflowStageId: string | null;
            pricePerUnit: number;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            productId: string;
            notes: string | null;
            payrollPeriodId: string | null;
            quantity: number;
            totalAmount: number;
            taskId: string | null;
            completedAt: Date;
        })[];
        user: {
            id: string;
            firstName: string;
            lastName: string;
            role: {
                id: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                color: string | null;
                order: number;
                code: string;
                isSystem: boolean;
                permissions: import("@prisma/client/runtime/library").JsonValue;
            };
        };
        penalties: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            amount: number;
            reason: string;
            productId: string | null;
            createdById: string;
            date: Date;
            notes: string | null;
            isCancelled: boolean;
            cancelledAt: Date | null;
            cancelledById: string | null;
            payrollPeriodId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        notes: string | null;
        baseSalary: number;
        periodStart: Date;
        periodEnd: Date;
        workAmount: number;
        commissionAmount: number;
        ordersAmount: number;
        penaltyAmount: number;
        totalAmount: number;
        status: import(".prisma/client").$Enums.PayrollStatus;
        approvedById: string | null;
        approvedAt: Date | null;
        paidById: string | null;
        paidAt: Date | null;
    })[]>;
    findPayrollPeriod(id: string): Promise<{
        workLogs: ({
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
            product: {
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
            task: {
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
            };
        } & {
            id: string;
            productTypeId: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            workflowStageId: string | null;
            pricePerUnit: number;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            productId: string;
            notes: string | null;
            payrollPeriodId: string | null;
            quantity: number;
            totalAmount: number;
            taskId: string | null;
            completedAt: Date;
        })[];
        user: {
            id: string;
            firstName: string;
            lastName: string;
            role: {
                id: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                color: string | null;
                order: number;
                code: string;
                isSystem: boolean;
                permissions: import("@prisma/client/runtime/library").JsonValue;
            };
        };
        penalties: ({
            product: {
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
            createdBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            amount: number;
            reason: string;
            productId: string | null;
            createdById: string;
            date: Date;
            notes: string | null;
            isCancelled: boolean;
            cancelledAt: Date | null;
            cancelledById: string | null;
            payrollPeriodId: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        notes: string | null;
        baseSalary: number;
        periodStart: Date;
        periodEnd: Date;
        workAmount: number;
        commissionAmount: number;
        ordersAmount: number;
        penaltyAmount: number;
        totalAmount: number;
        status: import(".prisma/client").$Enums.PayrollStatus;
        approvedById: string | null;
        approvedAt: Date | null;
        paidById: string | null;
        paidAt: Date | null;
    }>;
    calculatePayroll(dto: CalculatePayrollDto): Promise<any[]>;
    approvePayrollPeriod(id: string, body: {
        notes?: string;
    }, req: any): Promise<{
        user: {
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
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        notes: string | null;
        baseSalary: number;
        periodStart: Date;
        periodEnd: Date;
        workAmount: number;
        commissionAmount: number;
        ordersAmount: number;
        penaltyAmount: number;
        totalAmount: number;
        status: import(".prisma/client").$Enums.PayrollStatus;
        approvedById: string | null;
        approvedAt: Date | null;
        paidById: string | null;
        paidAt: Date | null;
    }>;
    markPayrollAsPaid(id: string, body: {
        notes?: string;
    }, req: any): Promise<{
        user: {
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
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        notes: string | null;
        baseSalary: number;
        periodStart: Date;
        periodEnd: Date;
        workAmount: number;
        commissionAmount: number;
        ordersAmount: number;
        penaltyAmount: number;
        totalAmount: number;
        status: import(".prisma/client").$Enums.PayrollStatus;
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
    findWorkLogs(userId?: string, productTypeId?: string, stage?: ProductionStage, startDate?: string, endDate?: string, unassigned?: string): Promise<({
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
        user: {
            id: string;
            firstName: string;
            lastName: string;
            role: {
                id: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                color: string | null;
                order: number;
                code: string;
                isSystem: boolean;
                permissions: import("@prisma/client/runtime/library").JsonValue;
            };
        };
        product: {
            order: {
                id: string;
                orderNumber: string;
                customerName: string;
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
        task: {
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
        };
    } & {
        id: string;
        productTypeId: string;
        stage: import(".prisma/client").$Enums.ProductionStage;
        workflowStageId: string | null;
        pricePerUnit: number;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        productId: string;
        notes: string | null;
        payrollPeriodId: string | null;
        quantity: number;
        totalAmount: number;
        taskId: string | null;
        completedAt: Date;
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
            baseSalary: number;
            workAmount: number;
            commissionAmount: number;
            penaltyAmount: number;
            totalAmount: number;
            workLogsCount: number;
        }[];
    }>;
}
