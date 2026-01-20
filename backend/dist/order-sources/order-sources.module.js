"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderSourcesModule = void 0;
const common_1 = require("@nestjs/common");
const order_sources_controller_1 = require("./order-sources.controller");
const order_sources_service_1 = require("./order-sources.service");
const prisma_module_1 = require("../prisma/prisma.module");
let OrderSourcesModule = class OrderSourcesModule {
};
exports.OrderSourcesModule = OrderSourcesModule;
exports.OrderSourcesModule = OrderSourcesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [order_sources_controller_1.OrderSourcesController],
        providers: [order_sources_service_1.OrderSourcesService],
        exports: [order_sources_service_1.OrderSourcesService],
    })
], OrderSourcesModule);
//# sourceMappingURL=order-sources.module.js.map