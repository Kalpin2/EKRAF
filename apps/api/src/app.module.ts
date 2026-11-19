import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard, PermissionsGuard } from './auth/guards';
import { AuthModule } from './auth/auth.module';
import { CoreModule } from './modules/core/core.module';
import { OperationsModule } from './modules/operations/operations.module';
import { StrategyModule } from './modules/strategy/strategy.module';
import { FinanceModule } from './modules/finance/finance.module';
import { GrowthModule } from './modules/growth/growth.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ExportModule } from './modules/export/export.module';
import { PlayerModule } from './modules/player/player.module';

@Module({
  imports: [
    AuthModule,
    CoreModule,
    OperationsModule,
    StrategyModule,
    FinanceModule,
    GrowthModule,
    AnalyticsModule,
    ExportModule,
    PlayerModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
