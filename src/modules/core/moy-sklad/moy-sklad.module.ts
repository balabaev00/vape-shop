import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createMoySkladConfig } from 'src/configs';

import { MoySkladRetailStoreService } from './services';
import { MoySkladEfficiencyService } from './services/moy-sklad.efficiency.service';
import { MoySkladRequesterService } from './services/moy-sklad.requester.service';
import { MoySkladTurnoverService } from './services/moy-sklad.turnover.service';

@Module({
    imports: [
        HttpModule.registerAsync({
            useFactory: createMoySkladConfig,
            inject: [ConfigService],
        }),
    ],
    providers: [
        MoySkladRequesterService,
        MoySkladTurnoverService,
        MoySkladEfficiencyService,
        MoySkladRetailStoreService,
    ],
    exports: [
        MoySkladTurnoverService,
        MoySkladEfficiencyService,
        MoySkladRetailStoreService,
    ],
})
export class MoySkladModule { }
