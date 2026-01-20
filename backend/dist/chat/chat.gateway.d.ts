import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private chatService;
    server: Server;
    private logger;
    private connectedUsers;
    constructor(chatService: ChatService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(client: Socket, data: {
        roomId: string;
        userType: 'customer' | 'manager';
        userId?: string;
    }): Promise<{
        success: boolean;
        room: {
            catalogOrder: {
                status: import(".prisma/client").$Enums.CatalogOrderStatus;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                orderNumber: string;
                customerName: string;
                customerPhone: string;
                totalAmount: number | null;
                deliveryAddress: string | null;
                comment: string | null;
                customerEmail: string | null;
                cancellationReason: string | null;
                contactedAt: Date | null;
                contactedBy: string | null;
                processedAt: Date | null;
                processedBy: string | null;
            };
            messages: {
                id: string;
                createdAt: Date;
                content: string;
                roomId: string;
                senderType: string;
                senderId: string | null;
                senderName: string;
                isRead: boolean;
                readAt: Date | null;
            }[];
        } & {
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerName: string;
            customerPhone: string | null;
            customerEmail: string | null;
            catalogOrderId: string | null;
            guestSessionId: string | null;
            lastMessageAt: Date | null;
            lastMessageText: string | null;
            unreadCount: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        room?: undefined;
    }>;
    handleSendMessage(client: Socket, data: {
        roomId: string;
        content: string;
        senderType: 'CUSTOMER' | 'MANAGER';
        senderId?: string;
        senderName: string;
    }): Promise<{
        success: boolean;
        message: {
            id: string;
            createdAt: Date;
            content: string;
            roomId: string;
            senderType: string;
            senderId: string | null;
            senderName: string;
            isRead: boolean;
            readAt: Date | null;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    handleTyping(client: Socket, data: {
        roomId: string;
        userType: string;
        userName: string;
    }): void;
    handleStopTyping(client: Socket, data: {
        roomId: string;
    }): void;
    handleMarkAsRead(client: Socket, data: {
        roomId: string;
        messageIds?: string[];
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleLeaveRoom(client: Socket, data: {
        roomId: string;
    }): {
        success: boolean;
    };
    handleCheckOnline(client: Socket): Promise<{
        online: boolean;
        message?: string;
        workingHours?: {
            start: string;
            end: string;
        };
    }>;
}
