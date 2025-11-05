import { YeastarService } from './yeastar.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class YeastarController {
    private readonly yeastarService;
    private readonly prisma;
    constructor(yeastarService: YeastarService, prisma: PrismaService);
    makeCall(req: any, body: {
        phoneNumber: string;
    }): Promise<{
        success: boolean;
        callid: string;
        status: string;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        callid?: undefined;
        status?: undefined;
    }>;
    hangupCall(req: any, body: {
        callid: string;
    }): Promise<{
        success: boolean;
        message: any;
    }>;
    getActiveCalls(req: any): Promise<{
        success: boolean;
        calls: any[];
        message?: undefined;
    } | {
        success: boolean;
        calls: any[];
        message: any;
    }>;
}
