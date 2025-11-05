import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export declare class TelegramService implements OnModuleInit {
    private prisma;
    private readonly logger;
    private bot;
    private readonly botToken;
    private userStates;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    private registerCommands;
    notifyNewTask(userId: string, taskTitle: string, orderNumber: string, quantity: number): Promise<void>;
    requestDefectPhoto(userId: string, taskId: string, reason: string, quantity: number): Promise<boolean>;
    generateTelegramLink(userId: string): string;
    sendDefectNotification(productData: {
        productName: string;
        productType: string;
        orderNumber: string;
        customerName: string;
        notes?: string;
        photoUrl?: string;
    }): Promise<void>;
    sendMessage(chatId: string, message: string): Promise<void>;
    sendPhotoMessage(chatId: string, photoUrl: string, caption: string): Promise<void>;
}
