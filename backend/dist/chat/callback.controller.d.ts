import { CallbackService } from "./callback.service";
export declare class CallbackController {
    private readonly callbackService;
    constructor(callbackService: CallbackService);
    create(body: {
        name: string;
        phone: string;
        message?: string;
        catalogOrderId?: string;
        preferredTime?: string;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        status: string;
        notes: string | null;
        phone: string;
        processedAt: Date | null;
        processedBy: string | null;
        catalogOrderId: string | null;
        preferredTime: string | null;
    }>;
    findAll(status?: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        status: string;
        notes: string | null;
        phone: string;
        processedAt: Date | null;
        processedBy: string | null;
        catalogOrderId: string | null;
        preferredTime: string | null;
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        status: string;
        notes: string | null;
        phone: string;
        processedAt: Date | null;
        processedBy: string | null;
        catalogOrderId: string | null;
        preferredTime: string | null;
    }>;
    markContacted(id: string, body: {
        notes?: string;
    }, req: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        status: string;
        notes: string | null;
        phone: string;
        processedAt: Date | null;
        processedBy: string | null;
        catalogOrderId: string | null;
        preferredTime: string | null;
    }>;
    markCompleted(id: string, body: {
        notes?: string;
    }, req: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        status: string;
        notes: string | null;
        phone: string;
        processedAt: Date | null;
        processedBy: string | null;
        catalogOrderId: string | null;
        preferredTime: string | null;
    }>;
    cancel(id: string, body: {
        notes?: string;
    }, req: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        status: string;
        notes: string | null;
        phone: string;
        processedAt: Date | null;
        processedBy: string | null;
        catalogOrderId: string | null;
        preferredTime: string | null;
    }>;
    remove(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        status: string;
        notes: string | null;
        phone: string;
        processedAt: Date | null;
        processedBy: string | null;
        catalogOrderId: string | null;
        preferredTime: string | null;
    }>;
}
