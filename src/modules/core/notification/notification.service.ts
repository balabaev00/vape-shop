import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { ParseMode } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class NotificationService {
    constructor(
        @InjectBot()
        private readonly telegramBot: Telegraf<Context>
    ) { }

    async send(chatId: number, message: string, parseMode: ParseMode = 'Markdown'): Promise<void> {
        await this.telegramBot.telegram.sendMessage(chatId, message, { parse_mode: parseMode });
    }
}
