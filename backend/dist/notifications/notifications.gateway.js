"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const wsAllowedOrigins = [
    "http://localhost",
    "http://localhost:5173",
    ...(process.env.WS_CORS_ORIGINS ?? "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    ...(process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== "*"
        ? [process.env.CORS_ORIGIN]
        : []),
];
let NotificationsGateway = class NotificationsGateway {
    constructor(jwtService) {
        this.jwtService = jwtService;
        this.logger = new common_1.Logger("NotificationsGateway");
    }
    handleConnection(client) {
        const token = client.handshake.auth?.token ||
            client.handshake.headers?.authorization?.replace("Bearer ", "");
        if (!token) {
            this.logger.warn(`Notifications: rejected (no token): ${client.id}`);
            client.disconnect();
            return;
        }
        try {
            const payload = this.jwtService.verify(token);
            client.userId = payload.sub;
            client.join(`user:${payload.sub}`);
            client.join("all");
            this.logger.log(`Notifications: connected ${payload.email} (${client.id})`);
        }
        catch {
            this.logger.warn(`Notifications: invalid token: ${client.id}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.debug(`Notifications: disconnected ${client.id}`);
    }
    notifyShipmentsChanged() {
        this.server?.to("all").emit("shipments:changed");
    }
    notifyDefectsChanged() {
        this.server?.to("all").emit("defects:changed");
    }
    notifyTasksChanged(userId) {
        if (userId) {
            this.server?.to(`user:${userId}`).emit("tasks:changed");
        }
        else {
            this.server?.to("all").emit("tasks:changed");
        }
    }
    notifyOrdersChanged() {
        this.server?.to("all").emit("orders:changed");
    }
    notifyProductsChanged() {
        this.server?.to("all").emit("products:changed");
    }
    notifyInventoryChanged() {
        this.server?.to("all").emit("inventory:changed");
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
exports.NotificationsGateway = NotificationsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: wsAllowedOrigins,
            credentials: true,
        },
        namespace: "/notifications",
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map