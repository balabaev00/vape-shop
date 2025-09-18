import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';

import { NotificationService } from './notification.service';

@Module({
    imports: [
        TelegrafModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                token: configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
            }),
        }),
    ],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule { }
