import { GoogleSheetsService, GoogleSheetsTableService, IGoogleSheetData } from '@google-sheets/services';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dayjs from 'dayjs';

import {
    EGoogleSheetsSalePlanColumnName,
    EGoogleSheetsSalePlanTablePeriodsName,
    EGoogleSheetsSalePlanTableSheetName,
} from '../enums';
import { TProductWithCategory, TSalesPeriod, TSalesPlanTable } from '../types';

@Injectable()
export class VapeShopGoogleSheetsSalesPlanService {
    private readonly GOOGLE_SALES_PLAN_SHEET_ID: string;
    private readonly logger = new Logger(VapeShopGoogleSheetsSalesPlanService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly googleSheetsTableService: GoogleSheetsTableService,
        private readonly googleSheetsService: GoogleSheetsService,
    ) {
        this.GOOGLE_SALES_PLAN_SHEET_ID = this.configService.getOrThrow('GOOGLE_SALES_PLAN_SHEET_ID');
    }

    getSheetData(sheetName: EGoogleSheetsSalePlanTableSheetName): Promise<IGoogleSheetData> {
        return this.googleSheetsService.getSheetData(
            this.GOOGLE_SALES_PLAN_SHEET_ID,
            sheetName
        );
    }

    getSalesPlanProductsNames(table: TSalesPlanTable): TProductWithCategory[] {
        return table.rows
            .map(row => {
                const category = row.cells.get(EGoogleSheetsSalePlanColumnName.Category)?.value;
                const productName = row.cells.get(EGoogleSheetsSalePlanColumnName.Product)?.value;

                if (typeof productName === 'string') {
                    return {
                        category: typeof category === 'string' ? category : '',
                        productName: productName
                    };
                }
            })
            .filter(Boolean) as TProductWithCategory[];
    }

    getSalesPlanTable(sheetData: IGoogleSheetData): TSalesPlanTable {
        return this.googleSheetsTableService.getFilteredTableData
            (sheetData,
                Object.values(EGoogleSheetsSalePlanColumnName)
            );
    }

    getPeriods(sheetData: IGoogleSheetData): TSalesPeriod {
        const { values } = sheetData;

        // Константы для поиска
        const PERIOD_MARKERS = {
            START: EGoogleSheetsSalePlanTablePeriodsName.Start,
            END: EGoogleSheetsSalePlanTablePeriodsName.End
        } as const;

        let startDate: dayjs.Dayjs;
        let endDate: dayjs.Dayjs;
        let foundMarkers = 0;
        const requiredMarkers = Object.keys(PERIOD_MARKERS).length;

        // Проходим по строкам
        for (const row of values) {
            // Если уже нашли все нужные маркеры, выходим
            if (foundMarkers === requiredMarkers) {
                break;
            }

            // Проходим по ячейкам в строке
            for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
                const cell = row[cellIndex];

                if (cell === PERIOD_MARKERS.START && !startDate) {
                    const startDateCell = row[cellIndex + 1];
                    if (startDateCell) {
                        // Валидируем и форматируем дату
                        const date = dayjs.utc(startDateCell, 'DD.MM.YYYY');
                        if (date.isValid()) {
                            startDate = date;
                            foundMarkers++;
                            this.logger.log(`Начало периода: ${startDate}`);
                        } else {
                            this.logger.warn(`Неверный формат даты начала периода: ${startDateCell}`);
                        }
                    }
                }

                if (cell === PERIOD_MARKERS.END && !endDate) {
                    const endDateCell = row[cellIndex + 1];
                    if (endDateCell) {
                        // Валидируем и форматируем дату
                        const date = dayjs.utc(endDateCell, 'DD.MM.YYYY');
                        if (date.isValid()) {
                            endDate = date;
                            foundMarkers++;
                            this.logger.log(`Конец периода: ${endDate}`);
                        } else {
                            this.logger.warn(`Неверный формат даты конца периода: ${endDateCell}`);
                        }
                    }
                }
            }
        }

        // Проверяем, что нашли все нужные маркеры
        if (foundMarkers !== requiredMarkers) {
            throw new Error(`Не удалось найти все маркеры периодов. Найдено: ${foundMarkers}, требуется: ${requiredMarkers}`);
        }

        return {
            startDate,
            endDate
        };
    }

    async updateSalesCount(
        tableData: TSalesPlanTable,
        productsNames: string[],
        allRetailStoreSalesCountByProductNameMap: Map<string, number>,
        sheetName: EGoogleSheetsSalePlanTableSheetName,
    ) {
        const soldColumn = tableData.columns.find(col => col.name === EGoogleSheetsSalePlanColumnName.Sold);

        if (!soldColumn) {
            throw new Error(`Колонка "${EGoogleSheetsSalePlanColumnName.Sold}" не найдена`);
        }

        const promises = [];
        for (const productName of productsNames) {
            this.logger.log(`Обрабатываем товар: ${productName}`);

            // Найти строку с товаром
            const productRow = tableData.rows.find(row =>
                row.cells.get(EGoogleSheetsSalePlanColumnName.Product)?.value === productName
            );

            if (!productRow) {
                this.logger.warn(`Строка с товаром "${productName}" не найдена в таблице`);
                continue; // Пропускаем, если строка с товаром не найдена
            }

            this.logger.log(`Найдена строка для товара "${productName}"`);

            const salesCountProductCell = productRow.cells.get(EGoogleSheetsSalePlanColumnName.Sold);

            if (!salesCountProductCell) {
                this.logger.warn(`Ячейка с количеством продаж для товара "${productName}" не найдена`);
                continue; // Пропускаем, если ячейка с количеством продаж не найдена
            }

            this.logger.log(`Найдена ячейка продаж для товара "${productName}" в позиции ${salesCountProductCell.position.letter}${salesCountProductCell.position.number}`);

            // Получить количество проданных товаров
            const soldCount = allRetailStoreSalesCountByProductNameMap.get(productName);

            if (soldCount === undefined) {
                this.logger.warn(`Нет данных о продажах для товара "${productName}"`);
                continue; // Пропускаем, если нет данных о продажах
            }

            this.logger.log(`Обновляем количество продаж для товара "${productName}": ${soldCount}`);

            promises.push(this.googleSheetsService.updateCell(
                this.GOOGLE_SALES_PLAN_SHEET_ID,
                sheetName,
                `${salesCountProductCell.position.letter}${salesCountProductCell.position.number}`,
                soldCount
            ));
        }

        await Promise.all(promises);
    }

    // async setNewSales(sheetName: EGoogleSheetsSalePlanTableSheetName): Promise<void> {
    //     await this.googleSheetsService.updateCell(
    //         this.GOOGLE_SALES_PLAN_SHEET_ID,
    //         sheetName,
    //         'B2',
    //         850,
    //     );
    // }
}
