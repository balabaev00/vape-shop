import { MoySkladTurnoverService } from '@moy-sklad/services';
import { Injectable } from '@nestjs/common';
import { VapeShopSynchronizeService } from '@vape-shop/services/vape-shop.synchronize.service';

@Injectable()
export class AppService {
    constructor(
        private readonly moySkladService: MoySkladTurnoverService,
        private readonly vapeShopSynchronizeService: VapeShopSynchronizeService,
    ) { }

    async getToDayTurnoverReport(): Promise<any> {
        return this.vapeShopSynchronizeService.getToDayTurnoverReport();
        // return this.moySkladService.getTurnoverReport({
        //     momentFrom: '2025-01-01',
        //     momentTo: '2025-01-31',
        //     type: 'demand',
        // });
    }

    async getSalesPeriodTurnoverReport(): Promise<any> {
        return this.vapeShopSynchronizeService.getSalesPeriodTurnoverReport();
    }
}
