import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
export declare class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    server: Server;
    private logger;
    constructor(jwtService: JwtService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    notifyShipmentsChanged(): void;
    notifyDefectsChanged(): void;
    notifyTasksChanged(userId?: string): void;
    notifyOrdersChanged(): void;
    notifyProductsChanged(): void;
    notifyInventoryChanged(): void;
}
