import { MoySkladTurnoverService } from '@moy-sklad/services';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VapeShopTurnoverReportService {
    constructor(
        private readonly moySkladTurnoverService: MoySkladTurnoverService,
    ) { }

    async getTurnoverReport(date: string): Promise<void> {

    }
}
