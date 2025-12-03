"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const orders_module_1 = require("./orders/orders.module");
const products_module_1 = require("./products/products.module");
const upload_module_1 = require("./upload/upload.module");
const quality_checks_module_1 = require("./quality-checks/quality-checks.module");
const telegram_module_1 = require("./telegram/telegram.module");
const product_types_module_1 = require("./product-types/product-types.module");
const analytics_module_1 = require("./analytics/analytics.module");
const tasks_module_1 = require("./tasks/tasks.module");
const inventory_module_1 = require("./inventory/inventory.module");
const shipments_module_1 = require("./shipments/shipments.module");
const yeastar_module_1 = require("./yeastar/yeastar.module");
const workflow_module_1 = require("./workflow/workflow.module");
const company_settings_module_1 = require("./company-settings/company-settings.module");
const catalog_categories_module_1 = require("./catalog-categories/catalog-categories.module");
const catalog_products_module_1 = require("./catalog-products/catalog-products.module");
const catalog_orders_module_1 = require("./catalog-orders/catalog-orders.module");
const contact_requests_module_1 = require("./contact-requests/contact-requests.module");
const public_module_1 = require("./public/public.module");
const chat_module_1 = require("./chat/chat.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            orders_module_1.OrdersModule,
            products_module_1.ProductsModule,
            product_types_module_1.ProductTypesModule,
            upload_module_1.UploadModule,
            telegram_module_1.TelegramModule,
            quality_checks_module_1.QualityChecksModule,
            analytics_module_1.AnalyticsModule,
            tasks_module_1.TasksModule,
            inventory_module_1.InventoryModule,
            shipments_module_1.ShipmentsModule,
            yeastar_module_1.YeastarModule,
            workflow_module_1.WorkflowModule,
            company_settings_module_1.CompanySettingsModule,
            catalog_categories_module_1.CatalogCategoriesModule,
            catalog_products_module_1.CatalogProductsModule,
            catalog_orders_module_1.CatalogOrdersModule,
            contact_requests_module_1.ContactRequestsModule,
            public_module_1.PublicModule,
            chat_module_1.ChatModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map