import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getProductionOverview(): Promise<{
        orders: {
            total: number;
            active: number;
            completed: number;
            completionRate: string;
        };
        products: {
            total: number;
            inProduction: number;
            completed: number;
            rejected: number;
            pendingQualityCheck: number;
            completionRate: string;
        };
        stageDistribution: Record<string, number>;
    }>;
    getUserPerformance(): Promise<{
        user: {
            id: string;
            name: string;
            role: {
                name: string;
                code: string;
            };
        };
        stats: {
            completedTasks: number;
            avgTaskDurationHours: number;
            hasActiveTask: boolean;
            activeTask: {
                productName: string;
                orderNumber: string;
                stage: import(".prisma/client").$Enums.ProductionStage;
                startedAt: Date;
            } | null;
        };
    }[]>;
    getQualityStats(): Promise<{
        total: number;
        approved: number;
        rejected: number;
        pending: number;
        approvalRate: string;
        recentRejections: {
            id: string;
            productName: string;
            orderNumber: string;
            customerName: string;
            reason: string | null;
            checkedBy: string;
            checkedAt: Date | null;
        }[];
    }>;
    getProductTypeStats(): Promise<{
        type: string;
        total: number;
        completed: number;
        inProduction: number;
        rejected: number;
        completionRate: string;
    }[]>;
    getPerformanceSummary(startDate?: Date, endDate?: Date): Promise<{
        period: {
            start: Date;
            end: Date;
            days: number;
        };
        ordersCreated: number;
        ordersCompleted: number;
        productsCompleted: number;
        qualityChecksPerformed: number;
        avgProductsPerDay: number;
    }>;
    getFullCycleAnalytics(startDate?: Date, endDate?: Date): Promise<{
        period: {
            start: Date;
            end: Date;
            days: number;
        };
        summary: {
            totalDelivered: number;
            avgFullCycleHours: number;
            avgProductionHours: number;
            avgWarehouseHours: number;
            avgDeliveryHours: number;
            avgStageHours: Record<string, number>;
        };
        completedCycles: {
            orderNumber: string;
            customerName: string;
            productName: string;
            productType: string;
            quantity: number;
            orderCreatedAt: Date;
            deliveredAt: Date;
            durations: {
                fullCycleHours: number;
                productionHours: number;
                warehouseHours: number;
                deliveryHours: number;
                stageHours: Record<string, number>;
            };
        }[];
        ordersInProgress: {
            orderNumber: string;
            customerName: string;
            createdAt: Date;
            currentDurationHours: number;
            totalProducts: number;
            completedProducts: number;
            completionPercent: number;
            products: {
                name: string;
                type: string;
                stage: import(".prisma/client").$Enums.ProductionStage;
                quantity: number;
            }[];
        }[];
    }>;
    getProductivityReport(startDate?: Date, endDate?: Date): Promise<{
        period: {
            start: Date;
            end: Date;
            workingDays: number;
        };
        totalWorkers: number;
        salaryWorkers: number;
        pieceRateWorkers: number;
        workers: {
            worker: {
                id: string;
                name: string;
                role: {
                    name: string;
                    code: string;
                    color: string | null;
                };
                paymentType: import(".prisma/client").$Enums.PaymentType;
                monthlySalary: number | null;
            };
            stats: {
                itemsMade: number;
                tasksCompleted: number;
                earnedAmount: number;
                coefficient: number;
                workingDays: number;
                stageBreakdown: Record<string, number>;
            };
        }[];
    }>;
    private countWorkingDays;
}
