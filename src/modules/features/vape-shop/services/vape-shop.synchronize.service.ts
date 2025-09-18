import { MoySkladRetailStoreService, MoySkladTurnoverService } from '@moy-sklad/services';
import { Injectable, Logger } from '@nestjs/common';
import { TMoySkladRetailStore } from '@src/modules/core/moy-sklad';
import * as dayjs from 'dayjs';

import { EGoogleSheetsSalePlanTableSheetName } from '../google-sheets/sales-plan/enums';
import {
    VapeShopGoogleSheetsSalesPlanService,
} from '../google-sheets/sales-plan/services/vape-shop.google-sheets.sales-plan.service';
import { TSalesPlanTable } from '../google-sheets/sales-plan/types';
import { VapeShopReportMessageService } from './vape-shop.report.message.service';

@Injectable()
export class VapeShopSynchronizeService {
    private readonly logger = new Logger(VapeShopSynchronizeService.name);

    constructor(
        private readonly moySkladTurnoverService: MoySkladTurnoverService,
        private readonly moySkladRetailStoreService: MoySkladRetailStoreService,
        private readonly vapeShopGoogleSheetsSalesPlanService: VapeShopGoogleSheetsSalesPlanService,
        private readonly vapeShopReportMessageService: VapeShopReportMessageService,
    ) { }

    async getSalesPeriodTurnoverReport() {
        const [retailStores, sheetData] = await Promise.all([
            this.moySkladRetailStoreService.get(),
            this.vapeShopGoogleSheetsSalesPlanService.getSheetData(EGoogleSheetsSalePlanTableSheetName.Chita),
        ]);
        const salesPeriod = this.vapeShopGoogleSheetsSalesPlanService.getPeriods(sheetData);
        const tableData = this.vapeShopGoogleSheetsSalesPlanService.getSalesPlanTable(sheetData);
        const productsNames = this.vapeShopGoogleSheetsSalesPlanService.getSalesPlanProductsNames(tableData);

        // Инициализируем общую Map для всех товаров
        const totalSalesCountByProductNameMap = new Map<string, number>();
        for (const productName of productsNames) {
            totalSalesCountByProductNameMap.set(productName, 0);
        }

        // Собираем продажи со всех точек продаж
        for (const retailStore of retailStores.rows) {
            const salesData = await this.processRetailStore(
                retailStore,
                salesPeriod.startDate,
                salesPeriod.endDate,
                tableData
            );

            // Добавляем продажи к общему счетчику
            for (const [productName, salesCount] of salesData.salesCountByProductNameMap) {
                const currentTotal = totalSalesCountByProductNameMap.get(productName) || 0;
                totalSalesCountByProductNameMap.set(productName, currentTotal + salesCount);
            }
        }

        // Обновляем Google Sheets с общими данными
        await this.vapeShopGoogleSheetsSalesPlanService.updateSalesCount(
            tableData,
            productsNames,
            totalSalesCountByProductNameMap,
            EGoogleSheetsSalePlanTableSheetName.Chita
        );
    }

    async getToDayTurnoverReport() {
        const toDay = dayjs.utc();
        const [retailStores, sheetData] = await Promise.all([
            this.moySkladRetailStoreService.get(),
            this.vapeShopGoogleSheetsSalesPlanService.getSheetData(EGoogleSheetsSalePlanTableSheetName.Chita),
        ]);
        const tableData = this.vapeShopGoogleSheetsSalesPlanService.getSalesPlanTable(sheetData);

        const reports = [];
        for (const retailStore of retailStores.rows) {
            const salesData = await this.processRetailStore(
                retailStore,
                toDay,
                toDay,
                tableData
            );

            reports.push({
                address: retailStore.name,
                salesCountByProductNameMap: salesData.salesCountByProductNameMap,
            });
        }

        await this.vapeShopReportMessageService.sendSummaryReport(
            reports,
            toDay.format('DD.MM.YYYY'),
        );
    }

    private async processRetailStore(
        retailStore: TMoySkladRetailStore,
        startDate: dayjs.Dayjs,
        endDate: dayjs.Dayjs,
        tableData: TSalesPlanTable
    ) {
        const turnoverReport = await this.moySkladTurnoverService.getTurnoverReport({
            momentFrom: startDate.hour(0).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss'),
            momentTo: endDate.hour(23).minute(59).second(59).format('YYYY-MM-DD HH:mm:ss'),
            type: 'retaildemand',
            retailStore: retailStore.meta.href,
            groupBy: 'product'
        });

        const productsNames = this.vapeShopGoogleSheetsSalesPlanService.getSalesPlanProductsNames(tableData);
        const salesCountByProductNameMap = new Map<string, number>();

        // Инициализируем Map с продуктами из Google Sheets
        for (const productName of productsNames) {
            salesCountByProductNameMap.set(productName, 0);
        }

        // Считаем продажи только по нужным продуктам
        for (const row of turnoverReport.rows) {
            const productName = row.assortment.name;
            const salesCount = row.outcome.quantity;

            // Ищем, к какому продукту из productsNames относится эта продажа
            for (const targetProductName of productsNames) {
                if (productName.toLowerCase().includes(targetProductName.toLowerCase())) {
                    // Добавляем количество к существующему продукту
                    const currentCount = salesCountByProductNameMap.get(targetProductName) || 0;
                    salesCountByProductNameMap.set(targetProductName, currentCount + salesCount);
                    break; // Нашли продукт, выходим из цикла
                }
            }
        }

        return {
            productsNames,
            salesCountByProductNameMap
        };
    }
}
