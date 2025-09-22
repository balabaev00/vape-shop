import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { VapeShopReportMessageService } from '@src/modules/features/vape-shop/services/vape-shop.report.message.service';
import { VapeShopSynchronizeService } from '@src/modules/features/vape-shop/services/vape-shop.synchronize.service';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramSchedulerService {
    private readonly logger = new Logger(TelegramSchedulerService.name);
    private readonly TELEGRAM_VAPE_SHOP_REPORT_CHAT: number;

    constructor(
        @InjectBot() private readonly bot: Telegraf,
        private readonly vapeShopSynchronizeService: VapeShopSynchronizeService,
        private readonly vapeShopReportMessageService: VapeShopReportMessageService,
        private readonly configService: ConfigService,
    ) {
        this.TELEGRAM_VAPE_SHOP_REPORT_CHAT = this.configService.getOrThrow('TELEGRAM_VAPE_SHOP_REPORT_CHAT');
    }

    /**
     * Автоматический запуск отчетов каждый день в 22:15 по UTC+9
     * Cron выражение: 15 13 * * * (13:15 UTC = 22:15 UTC+9)
     */
    @Cron('15 13 * * *', {
        name: 'daily-reports',
        timeZone: 'UTC',
    })
    async handleDailyReports() {
        this.logger.log('🚀 Запуск автоматических отчетов в 22:15 UTC+9');

        await this.bot.telegram.sendMessage(this.TELEGRAM_VAPE_SHOP_REPORT_CHAT, '🚀 Запущены автоматические отчеты');

        try {
            // Запускаем отчет по периоду продаж
            await this.handleSalesPeriodReport();

            // Небольшая пауза между отчетами
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Запускаем отчет за сегодня
            await this.handleTodayReport();

            await this.bot.telegram.sendMessage(this.TELEGRAM_VAPE_SHOP_REPORT_CHAT, '✅ Автоматические отчеты успешно выполнены');

            this.logger.log('✅ Автоматические отчеты успешно выполнены');
        } catch (error) {
            this.logger.error('❌ Ошибка при выполнении автоматических отчетов:', error);
        }
    }

    private async handleSalesPeriodReport() {
        try {
            this.logger.log('📊 Запуск отчета по периоду продаж...');

            await this.vapeShopSynchronizeService.getSalesPeriodTurnoverReport();

            this.logger.log('✅ Отчет по периоду продаж успешно выполнен');
        } catch (error) {
            this.logger.error('❌ Ошибка при выполнении отчета по периоду продаж:', error);
            throw error;
        }
    }

    private async handleTodayReport() {
        try {
            this.logger.log('📈 Запуск отчета за сегодня...');

            const { reports, day } = await this.vapeShopSynchronizeService.getToDayTurnoverReport();
            const message = this.vapeShopReportMessageService.createSalesTableMessage(reports, day);

            await this.bot.telegram.sendMessage(this.TELEGRAM_VAPE_SHOP_REPORT_CHAT, message);

            // Отправляем отчет в Telegram (если есть настроенный чат)
            // Можно добавить логику для отправки в определенный чат
            this.logger.log('📱 Отчет за сегодня подготовлен');
            this.logger.debug('Сообщение отчета:', message);

        } catch (error) {
            this.logger.error('❌ Ошибка при выполнении отчета за сегодня:', error);
            throw error;
        }
    }
}
