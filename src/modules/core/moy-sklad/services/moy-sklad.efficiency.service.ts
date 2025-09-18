import { Injectable, Logger } from '@nestjs/common';

import { TMoySkladTimezoneHeaders, TMoySkladTurnoverFilters, TSalesEfficiency } from '../types';
import { MoySkladTurnoverService } from './moy-sklad.turnover.service';

@Injectable()
export class MoySkladEfficiencyService {
    private readonly logger = new Logger(MoySkladEfficiencyService.name);

    constructor(private readonly turnoverService: MoySkladTurnoverService) { }

    /**
     * Расчет эффективности продаж за определенную дату
     * @param date - дата для анализа (формат: YYYY-MM-DD)
     * @param retailStoreId - ID точки продаж
     * @param timezoneHeaders - заголовки для работы с таймзонами
     * @returns Promise<TSalesEfficiency> - результат анализа эффективности
     */
    async calculateSalesEfficiency(
        date: string,
        retailStoreId: string,
        timezoneHeaders?: TMoySkladTimezoneHeaders
    ): Promise<TSalesEfficiency> {
        try {
            this.logger.log(`Расчет эффективности продаж для даты: ${date}, точка: ${retailStoreId}`);

            // Получаем отчет за указанную дату
            const filters: TMoySkladTurnoverFilters = {
                momentFrom: `${date} 00:00:00`,
                momentTo: `${date} 23:59:59`,
                type: 'retaildemand', // розничная продажа
                retailStore: retailStoreId,
                groupBy: 'product' // только товары, без модификаций
            };

            const report = await this.turnoverService.getTurnoverReport(filters, timezoneHeaders);

            if (!report.rows || report.rows.length === 0) {
                this.logger.warn(`Нет данных о продажах за дату: ${date}`);
                return {
                    date,
                    retailStore: retailStoreId,
                    totalSales: 0,
                    targetSales: 0,
                    efficiencyPercentage: 0
                };
            }

            // Подсчитываем общее количество продаж
            const totalSales = report.rows.reduce((total, item) => {
                return total + item.outcome.quantity;
            }, 0);

            // Подсчитываем количество целевых товаров
            const targetSales = report.rows.reduce((total, item) => {
                const isTarget = this.isTargetProduct(item.assortment);
                return total + (isTarget ? item.outcome.quantity : 0);
            }, 0);

            const efficiencyPercentage = totalSales > 0 ? (targetSales / totalSales) * 100 : 0;

            this.logger.log(`Эффективность продаж: ${efficiencyPercentage.toFixed(2)}% (${targetSales}/${totalSales})`);

            return {
                date,
                retailStore: retailStoreId,
                totalSales,
                targetSales,
                efficiencyPercentage: Number(efficiencyPercentage.toFixed(2))
            };
        } catch (error) {
            this.logger.error('Ошибка при расчете эффективности продаж', error);
            throw new Error(`Не удалось рассчитать эффективность продаж: ${error.message}`);
        }
    }

    /**
     * Получение детального отчета по эффективности с разбивкой по товарам
     * @param date - дата для анализа
     * @param retailStoreId - ID точки продаж
     * @param timezoneHeaders - заголовки для работы с таймзонами
     * @returns Promise<object> - детальный отчет
     */
    async getDetailedEfficiencyReport(
        date: string,
        retailStoreId: string,
        timezoneHeaders?: TMoySkladTimezoneHeaders
    ): Promise<object> {
        try {
            const filters: TMoySkladTurnoverFilters = {
                momentFrom: `${date} 00:00:00`,
                momentTo: `${date} 23:59:59`,
                type: 'retaildemand',
                retailStore: retailStoreId,
                groupBy: 'product'
            };

            const report = await this.turnoverService.getTurnoverReport(filters, timezoneHeaders);

            if (!report.rows || report.rows.length === 0) {
                return {
                    date,
                    retailStore: retailStoreId,
                    totalSales: 0,
                    targetSales: 0,
                    efficiencyPercentage: 0,
                    products: [],
                    targetProducts: [],
                    excludedProducts: []
                };
            }

            const products = report.rows.map(item => ({
                name: item.assortment.name,
                code: item.assortment.code,
                article: item.assortment.article,
                quantity: item.outcome.quantity,
                sum: item.outcome.sum,
                isTarget: this.isTargetProduct(item.assortment)
            }));

            const targetProducts = products.filter(p => p.isTarget);
            const excludedProducts = products.filter(p => !p.isTarget);

            const totalSales = products.reduce((sum, p) => sum + p.quantity, 0);
            const targetSales = targetProducts.reduce((sum, p) => sum + p.quantity, 0);
            const efficiencyPercentage = totalSales > 0 ? (targetSales / totalSales) * 100 : 0;

            return {
                date,
                retailStore: retailStoreId,
                totalSales,
                targetSales,
                efficiencyPercentage: Number(efficiencyPercentage.toFixed(2)),
                products,
                targetProducts,
                excludedProducts,
                summary: {
                    totalProducts: products.length,
                    targetProductsCount: targetProducts.length,
                    excludedProductsCount: excludedProducts.length
                }
            };
        } catch (error) {
            this.logger.error('Ошибка при получении детального отчета', error);
            throw new Error(`Не удалось получить детальный отчет: ${error.message}`);
        }
    }

    /**
     * Определение является ли товар целевым
     * @param assortment - товар для проверки
     * @returns boolean - true если товар целевой
     */
    private isTargetProduct(assortment: any): boolean {
        // Исключаем расходники (картриджи, испарители, фильтры)
        const excludedKeywords = [
            'картридж', 'испаритель', 'фильтр', 'расходник',
            'cartridge', 'coil', 'filter', 'consumable'
        ];

        const productName = assortment.name.toLowerCase();

        // Проверяем, не содержит ли название исключаемых слов
        const isExcluded = excludedKeywords.some(keyword =>
            productName.includes(keyword)
        );

        if (isExcluded) {
            return false;
        }

        // Здесь можно добавить дополнительную логику для определения целевых товаров
        // Например, по категории, бренду или другим критериям

        return true; // По умолчанию считаем все не-расходники целевыми
    }
}
