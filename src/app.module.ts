import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VapeShopModule } from '@vape-shop/vape-shop.module';

import { MoySkladModule } from './modules/core/moy-sklad/moy-sklad.module';
import { TelegramModule } from './modules/core/telegram/telegram.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            expandVariables: true,
        }),
        MoySkladModule,
        VapeShopModule,
        TelegramModule,
    ],
})
export class AppModule { }
