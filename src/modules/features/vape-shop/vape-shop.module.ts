import { MoySkladModule } from '@moy-sklad/moy-sklad.module';
import { Module } from '@nestjs/common';

import { VapeShopGoogleSheetsSalesPlanModule } from './google-sheets/sales-plan/vape-shop.google-sheets.sales-plan.module';
import { VapeShopReportBaseService } from './services/vape-shop.report.base.service';
import { VapeShopReportMessageService } from './services/vape-shop.report.message.service';
import { VapeShopSynchronizeService } from './services/vape-shop.synchronize.service';

@Module({
    imports: [
        MoySkladModule,
        VapeShopGoogleSheetsSalesPlanModule,
    ],
    providers: [
        VapeShopSynchronizeService,
        VapeShopReportMessageService,
        VapeShopReportBaseService,
    ],
    exports: [
        VapeShopSynchronizeService,
        VapeShopReportMessageService,
    ],
})
export class VapeShopModule { }
