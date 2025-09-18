import { GoogleSheetsModule } from '@google-sheets/google-sheets.module';
import { Module } from '@nestjs/common';

import { VapeShopGoogleSheetsSalesPlanService } from './services/vape-shop.google-sheets.sales-plan.service';

@Module({
    imports: [
        GoogleSheetsModule,
    ],
    providers: [
        VapeShopGoogleSheetsSalesPlanService,
    ],
    exports: [
        VapeShopGoogleSheetsSalesPlanService,
    ],
})
export class VapeShopGoogleSheetsSalesPlanModule { }
