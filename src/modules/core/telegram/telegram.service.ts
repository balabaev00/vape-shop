import { Injectable, Logger } from '@nestjs/common';
import { VapeShopReportMessageService } from '@src/modules/features/vape-shop/services/vape-shop.report.message.service';
import { VapeShopSynchronizeService } from '@src/modules/features/vape-shop/services/vape-shop.synchronize.service';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);

    constructor(
        @InjectBot() private readonly bot: Telegraf<Context>,
        private readonly vapeShopSynchronizeService: VapeShopSynchronizeService,
        private readonly vapeShopReportMessageService: VapeShopReportMessageService,
    ) {
        this.setupCommands();
        this.bot.telegram.setMyCommands([
            { command: 'sales_period_report', description: 'Запустить обновление данных в таблице продаж' },
            { command: 'today_report', description: 'Запустить отчет продаж за сегодня' },
        ])
    }

    private setupCommands() {
        // Команда для запуска отчета по периоду продаж
        this.bot.command('sales_period_report', async (ctx) => {
            await this.handleSalesPeriodReport(ctx);
        });

        // Команда для запуска отчета за сегодня
        this.bot.command('today_report', async (ctx) => {
            await this.handleTodayReport(ctx);
        });

        // Команда помощи
        this.bot.command('help', async (ctx) => {
            await ctx.reply(`
Доступные команды:
/sales_period_report - Запустить отчет по периоду продаж
/today_report - Запустить отчет за сегодня
/help - Показать это сообщение
            `);
        });
    }

    private async handleSalesPeriodReport(ctx: Context) {
        try {
            await ctx.reply('🚀 Запускаю отчет по периоду продаж... Пожалуйста, подождите ⏳');

            await this.vapeShopSynchronizeService.getSalesPeriodTurnoverReport();

            await ctx.reply('✅ Отчет по периоду продаж успешно выполнен. Данные в таблице Google Sheets обновлены!');
        } catch (error) {
            this.logger.error('Error in sales period report:', error);
            await ctx.reply('❌ Ошибка при выполнении отчета по периоду продаж');
        }
    }

    private async handleTodayReport(ctx: Context) {
        try {
            await ctx.reply('🚀 Запускаю отчет за сегодня... Пожалуйста, подождите ⏳');

            const { reports, day } = await this.vapeShopSynchronizeService.getToDayTurnoverReport();
            const message = this.vapeShopReportMessageService.createSalesTableMessage(reports, day);

            await ctx.reply(message, { parse_mode: 'Markdown' });
        } catch (error) {
            this.logger.error('Error in today report:', error);
            await ctx.reply('❌ Ошибка при выполнении отчета за сегодня');
        }
    }
}
