import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VapeShopModule } from '@vape-shop/vape-shop.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MoySkladModule } from './modules/core/moy-sklad/moy-sklad.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            expandVariables: true,
        }),
        MoySkladModule,
        VapeShopModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
