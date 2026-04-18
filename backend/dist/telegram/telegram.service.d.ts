import { OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { ClaudeCodeService } from "../claude-code/claude-code.service";
export declare class TelegramService implements OnModuleInit {
    private prisma;
    private configService;
    private claudeCodeService;
    private readonly logger;
    private bot;
    private readonly botToken;
    private readonly adminId;
    private userStates;
    private userStateTimeouts;
    private loginCodes;
    constructor(prisma: PrismaService, configService: ConfigService, claudeCodeService: ClaudeCodeService);
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
    sendPenaltyNotification(data: {
        userId: string;
        amount: number;
        reason: string;
        createdByName: string;
    }): Promise<void>;
    sendMessage(chatId: string, message: string): Promise<void>;
    sendPhotoMessage(chatId: string, photoUrl: string, caption: string): Promise<void>;
    generateLoginCode(userId: string): string;
    validateLoginCode(code: string): {
        valid: boolean;
        userId?: string;
    };
    removeLoginCode(code: string): void;
    private checkClaudeAccess;
    private splitMessage;
    notifyAdmins(message: string): Promise<void>;
}
