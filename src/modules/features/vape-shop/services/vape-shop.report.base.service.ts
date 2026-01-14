import { Injectable } from '@nestjs/common';
import { MoySkladTurnoverService, TMoySkladAssortment, TMoySkladRetailStore } from '@src/modules/core/moy-sklad';
import dayjs from 'dayjs';

import { TProductWithCategory } from '../google-sheets/sales-plan/types';
import { TSalesCountByProductNameMap } from '../types';

@Injectable()
export class VapeShopReportBaseService {
    constructor(
        private readonly moySkladTurnoverService: MoySkladTurnoverService,
    ) { }

    async processRetailStore(
        retailStore: TMoySkladRetailStore,
        startDate: dayjs.Dayjs,
        endDate: dayjs.Dayjs,
        productsInfo: TProductWithCategory[],
    ): Promise<Map<string, TSalesCountByProductNameMap>> {
        const turnoverReport = await this.moySkladTurnoverService.getTurnoverReport({
            momentFrom: startDate.hour(0).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss'),
            momentTo: endDate.hour(23).minute(59).second(59).format('YYYY-MM-DD HH:mm:ss'),
            type: 'retaildemand',
            retailStore: retailStore.meta.href,
            groupBy: 'product'
        });

        const salesCountByProductNameMap = new Map<string, TSalesCountByProductNameMap>();

        // Считаем продажи только по нужным продуктам
        for (const row of turnoverReport.rows) {
            const productName = row.assortment.name;
            const salesCount = row.outcome.quantity;

            // Пропускаем товары с нежелательными подстроками
            if (this.shouldSkipProduct(row.assortment, productsInfo)) {
                continue;
            }

            // Ищем, к какому продукту из productsInfo относится эта продажа
            for (const productInfo of productsInfo) {
                const targetProductName = productInfo.productName;

                // Проверяем соответствие по названию товара
                if (productName.toLowerCase().includes(targetProductName.toLowerCase())) {
                    const currentProductsMap = salesCountByProductNameMap.get(targetProductName);

                    if (currentProductsMap) {
                        // Обновляем существующий товар
                        currentProductsMap.productsMap.set(productName, salesCount);
                        currentProductsMap.salesCount += salesCount;
                    } else {
                        // Добавляем новый товар
                        salesCountByProductNameMap.set(targetProductName, {
                            salesCount,
                            productsMap: new Map<string, number>([
                                [productName, salesCount],
                            ]),
                        });
                    }

                    break; // Нашли соответствие, выходим из цикла
                }
            }
        }

        return salesCountByProductNameMap;
    }

    /**
     * Проверяет, нужно ли пропустить товар на основе его названия и категории
     * Исключает товары содержащие: аккумулятор, испаритель, катридж
     * И проверяет соответствие категории
     */
    private shouldSkipProduct(
        assortment: TMoySkladAssortment,
        productsInfo: TProductWithCategory[]
    ): boolean {
        const productName = assortment.name.toLowerCase();

        // Проверяем на нежелательные подстроки
        const excludedSubstrings = ['аккумулятор', 'испаритель', 'катридж'];
        if (excludedSubstrings.some(substring => productName.includes(substring.toLowerCase()))) {
            return true;
        }

        // Проверяем, есть ли соответствие по категории и названию в наших продуктах
        const categoryName = assortment.productFolder?.name?.toLowerCase() || '';

        for (const productInfo of productsInfo) {
            const isProductNameMatch = productName.includes(productInfo.productName.toLowerCase());
            const isCategoryMatch = categoryName.includes(productInfo.category.toLowerCase()) ||
                productInfo.category.toLowerCase().includes(categoryName);

            if (isProductNameMatch && (productInfo.category === '' || isCategoryMatch)) {
                return false; // Товар соответствует, не пропускаем
            }
        }

        return true; // Товар не найден в списке, пропускаем
    }
}
