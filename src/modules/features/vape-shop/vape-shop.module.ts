import { MoySkladModule } from '@moy-sklad/moy-sklad.module';
import { Module } from '@nestjs/common';

import { VapeShopGoogleSheetsSalesPlanModule } from './google-sheets/sales-plan/vape-shop.google-sheets.sales-plan.module';
import { VapeShopReportMessageService } from './services/vape-shop.report.message.service';
import { VapeShopSynchronizeService } from './services/vape-shop.synchronize.service';
import { VapeShopTurnoverCalculatorService } from './services/vape-shop.turnover.calculator.service';
import { VapeShopTurnoverReportService } from './services/vape-shop.turnover.report.service';

@Module({
    imports: [
        MoySkladModule,
        VapeShopGoogleSheetsSalesPlanModule,
    ],
    providers: [
        VapeShopTurnoverReportService,
        VapeShopSynchronizeService,
        VapeShopTurnoverCalculatorService,
        VapeShopReportMessageService,
    ],
    exports: [
        VapeShopTurnoverReportService,
        VapeShopSynchronizeService,
        VapeShopReportMessageService,
    ],
})
export class VapeShopModule { }
