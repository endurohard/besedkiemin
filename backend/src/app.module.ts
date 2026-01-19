import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { UploadModule } from './upload/upload.module';
import { QualityChecksModule } from './quality-checks/quality-checks.module';
import { TelegramModule } from './telegram/telegram.module';
import { ProductTypesModule } from './product-types/product-types.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TasksModule } from './tasks/tasks.module';
import { InventoryModule } from './inventory/inventory.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { YeastarModule } from './yeastar/yeastar.module';
import { WorkflowModule } from './workflow/workflow.module';
import { CompanySettingsModule } from './company-settings/company-settings.module';
import { CatalogCategoriesModule } from './catalog-categories/catalog-categories.module';
import { CatalogProductsModule } from './catalog-products/catalog-products.module';
import { CatalogOrdersModule } from './catalog-orders/catalog-orders.module';
import { ContactRequestsModule } from './contact-requests/contact-requests.module';
import { PublicModule } from './public/public.module';
import { ChatModule } from './chat/chat.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { NomenclatureModule } from './nomenclature/nomenclature.module';
import { RolesModule } from './roles/roles.module';
import { OrderSourcesModule } from './order-sources/order-sources.module';
import { PayrollModule } from './payroll/payroll.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    ProductsModule,
    ProductTypesModule,
    UploadModule,
    TelegramModule,
    QualityChecksModule,
    AnalyticsModule,
    TasksModule,
    InventoryModule,
    ShipmentsModule,
    YeastarModule,
    WorkflowModule,
    CompanySettingsModule,
    CatalogCategoriesModule,
    CatalogProductsModule,
    CatalogOrdersModule,
    ContactRequestsModule,
    PublicModule,
    ChatModule,
    FeatureFlagsModule,
    NomenclatureModule,
    RolesModule,
    OrderSourcesModule,
    PayrollModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
