import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getStatus(): Promise<{
        online: boolean;
        message?: string;
        workingHours?: {
            start: string;
            end: string;
        };
    }>;
    getOrCreateRoom(catalogOrderId: string): Promise<{
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
    }>;
    getOrCreateGuestRoom(body: {
        guestSessionId: string;
        customerName: string;
        customerPhone?: string;
    }): Promise<{
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
    }>;
    getAllRooms(): Promise<{
        catalogOrder: {
            status: import(".prisma/client").$Enums.CatalogOrderStatus;
            id: string;
            orderNumber: string;
            customerPhone: string;
            customerEmail: string | null;
        } | {
            id: string;
            orderNumber: string;
            customerPhone: string;
            customerEmail: string;
            status: "GUEST";
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
    }[]>;
    getRoom(roomId: string): Promise<{
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
        } | null;
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
    }>;
    getUnreadMessages(roomId: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        roomId: string;
        senderType: string;
        senderId: string | null;
        senderName: string;
        isRead: boolean;
        readAt: Date | null;
    }[]>;
    getTotalUnreadCount(): Promise<{
        total: number;
    }>;
    markAsRead(roomId: string, body: {
        messageIds?: string[];
    }): Promise<{
        success: boolean;
    }>;
    closeRoom(roomId: string): Promise<{
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
    }>;
}
