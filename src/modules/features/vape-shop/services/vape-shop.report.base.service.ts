import { Injectable } from '@nestjs/common';
import { MoySkladTurnoverService, TMoySkladRetailStore } from '@src/modules/core/moy-sklad';
import dayjs from 'dayjs';

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
        productsNames: string[],
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
            if (this.shouldSkipProduct(productName)) {
                continue;
            }

            // Ищем, к какому продукту из productsNames относится эта продажа
            for (const targetProductName of productsNames) {
                if (productName.toLowerCase().includes(targetProductName.toLowerCase())) {
                    const currentProductsMap = salesCountByProductNameMap.get(targetProductName);

                    if (currentProductsMap) {
                        currentProductsMap.productsMap.set(productName, salesCount);
                        currentProductsMap.salesCount += salesCount;
                    } else {
                        salesCountByProductNameMap.set(targetProductName, {
                            salesCount,
                            productsMap: new Map<string, number>([
                                [productName, salesCount],
                            ]),
                        });
                    }

                    break;
                }
            }
        }

        return salesCountByProductNameMap;
    }

    /**
     * Проверяет, нужно ли пропустить товар на основе его названия
     * Исключает товары содержащие: аккумулятор, испаритель, катридж
     */
    private shouldSkipProduct(productName: string): boolean {
        const excludedSubstrings = ['аккумулятор', 'испаритель', 'катридж'];
        const lowerProductName = productName.toLowerCase();

        return excludedSubstrings.some(substring =>
            lowerProductName.includes(substring.toLowerCase())
        );
    }
}
