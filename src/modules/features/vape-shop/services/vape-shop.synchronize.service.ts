import { MoySkladRetailStoreService } from '@moy-sklad/services';
import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';

import { EGoogleSheetsSalePlanTableSheetName } from '../google-sheets/sales-plan/enums';
import {
    VapeShopGoogleSheetsSalesPlanService,
} from '../google-sheets/sales-plan/services/vape-shop.google-sheets.sales-plan.service';
import { TRetailStoreSalesData, TSalesCountByProductNameMap, TSalesReportByAddress } from '../types';
import { VapeShopReportBaseService } from './vape-shop.report.base.service';

@Injectable()
export class VapeShopSynchronizeService {
    constructor(
        private readonly vapeShopReportBaseService: VapeShopReportBaseService,
        private readonly moySkladRetailStoreService: MoySkladRetailStoreService,
        private readonly vapeShopGoogleSheetsSalesPlanService: VapeShopGoogleSheetsSalesPlanService,
    ) { }

    async getSalesPeriodTurnoverReport(): Promise<Map<string, TRetailStoreSalesData>> {
        const [retailStores, sheetData] = await Promise.all([
            this.moySkladRetailStoreService.get(),
            this.vapeShopGoogleSheetsSalesPlanService.getSheetData(EGoogleSheetsSalePlanTableSheetName.Chita),
        ]);
        const salesPeriod = this.vapeShopGoogleSheetsSalesPlanService.getPeriods(sheetData);
        const tableData = this.vapeShopGoogleSheetsSalesPlanService.getSalesPlanTable(sheetData);
        const productsNames = this.vapeShopGoogleSheetsSalesPlanService.getSalesPlanProductsNames(tableData);

        // Инициализируем общую Map для всех точек продаж
        const totalSalesCountByRetailStore = new Map<string, TRetailStoreSalesData>();

        // Собираем продажи со всех точек продаж
        for (const retailStore of retailStores.rows) {
            const salesData = await this.vapeShopReportBaseService.processRetailStore(
                retailStore,
                salesPeriod.startDate,
                salesPeriod.endDate,
                productsNames,
            );

            // Получаем или создаем запись для точки продаж
            let retailStoreData = totalSalesCountByRetailStore.get(retailStore.name);
            if (!retailStoreData) {
                retailStoreData = {
                    totalSalesCount: 0,
                    productsMap: new Map<string, TSalesCountByProductNameMap>()
                };
                totalSalesCountByRetailStore.set(retailStore.name, retailStoreData);
            }

            // Добавляем продажи к общему счетчику
            for (const [productName, salesCountByProductNameMap] of salesData.entries()) {
                retailStoreData.totalSalesCount += salesCountByProductNameMap.salesCount;

                const existingProduct = retailStoreData.productsMap.get(productName);
                if (existingProduct) {
                    // Обновляем существующий товар
                    existingProduct.salesCount += salesCountByProductNameMap.salesCount;

                    // Объединяем карты подтоваров
                    for (const [subProductName, subProductCount] of salesCountByProductNameMap.productsMap.entries()) {
                        const currentCount = existingProduct.productsMap.get(subProductName) || 0;
                        existingProduct.productsMap.set(subProductName, currentCount + subProductCount);
                    }
                } else {
                    // Добавляем новый товар
                    retailStoreData.productsMap.set(productName, {
                        salesCount: salesCountByProductNameMap.salesCount,
                        productsMap: new Map(salesCountByProductNameMap.productsMap)
                    });
                }
            }
        }

        // Создаем Map для обновления Google Sheets (только общие количества по товарам)
        const totalSalesCountByProductNameMap = new Map<string, number>();
        for (const productName of productsNames) {
            let totalCount = 0;
            for (const retailStoreData of totalSalesCountByRetailStore.values()) {
                const productData = retailStoreData.productsMap.get(productName);
                if (productData) {
                    totalCount += productData.salesCount;
                }
            }
            totalSalesCountByProductNameMap.set(productName, totalCount);
        }

        // Обновляем Google Sheets с общими данными
        await this.vapeShopGoogleSheetsSalesPlanService.updateSalesCount(
            tableData,
            productsNames,
            totalSalesCountByProductNameMap,
            EGoogleSheetsSalePlanTableSheetName.Chita
        );

        return totalSalesCountByRetailStore;
    }

    async getToDayTurnoverReport() {
        const toDay = dayjs.utc();
        const [retailStores, sheetData] = await Promise.all([
            this.moySkladRetailStoreService.get(),
            this.vapeShopGoogleSheetsSalesPlanService.getSheetData(EGoogleSheetsSalePlanTableSheetName.Chita),
        ]);
        const tableData = this.vapeShopGoogleSheetsSalesPlanService.getSalesPlanTable(sheetData);
        const productNames = this.vapeShopGoogleSheetsSalesPlanService.getSalesPlanProductsNames(tableData);

        const reports: TSalesReportByAddress[] = [];
        for (const retailStore of retailStores.rows) {
            const salesData = await this.vapeShopReportBaseService.processRetailStore(
                retailStore,
                toDay,
                toDay,
                productNames,
            );

            reports.push({
                address: retailStore.name,
                salesCountByProductNameMap: salesData,
            });
        }

        return {
            reports,
            day: toDay.format('DD.MM.YYYY'),
        };
    }
}
