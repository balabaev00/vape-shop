import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VapeShopModule } from '@src/modules/features/vape-shop/vape-shop.module';
import { TelegrafModule } from 'nestjs-telegraf';

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
    ],
    providers: [TelegramService],
    exports: [TelegramService],
})
export class TelegramModule { }
