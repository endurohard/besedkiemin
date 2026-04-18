import { TelegramService } from "./telegram.service";
import { PrismaService } from "../prisma/prisma.service";
export declare class TelegramController {
    private readonly telegramService;
    private readonly prisma;
    constructor(telegramService: TelegramService, prisma: PrismaService);
    getTelegramLink(req: any): {
        link: string;
        botUsername: string;
    };
    unlinkTelegram(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
