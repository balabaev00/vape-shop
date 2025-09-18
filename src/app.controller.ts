import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get('to-day-turnover-report')
    getHello(): Promise<string> {
        return this.appService.getToDayTurnoverReport();
    }

    @Get('sales-period-turnover-report')
    getSalesPeriodTurnoverReport(): Promise<any> {
        return this.appService.getSalesPeriodTurnoverReport();
    }
}
