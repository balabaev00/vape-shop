import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { VapeShopModule } from '@src/modules/features/vape-shop/vape-shop.module';
import { TelegrafModule } from 'nestjs-telegraf';

import { TelegramSchedulerService } from './telegram.scheduler.service';
import { TelegramService } from './telegram.service';

@Module({
    imports: [
        TelegrafModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                token: configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
            }),
        }),
        VapeShopModule,
        ScheduleModule.forRoot(),
    ],
    providers: [TelegramService, TelegramSchedulerService],
    exports: [TelegramService, TelegramSchedulerService],
})
export class TelegramModule { }
