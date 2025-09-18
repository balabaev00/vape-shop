import { Injectable, Logger } from '@nestjs/common';

import { GoogleSheetsService, IGoogleSheetData } from './google-sheets.service';

export interface ITablePosition {
    letter: string;  // A, B, C, D...
    number: number;  // 1, 2, 3, 4...
}

export interface ITableColumn {
    name: string;
    index: number;
    position: ITablePosition;
}

export interface ITableCellData<T> {
    position: ITablePosition;
    value: T;
}

export interface ITableRow<TKey extends string, TCellData> {
    cells: Map<TKey, ITableCellData<TCellData>>;
}

export interface ITableData<TRowsKey extends string, TCellData> {
    rows: ITableRow<TRowsKey, TCellData>[];
    columns: ITableColumn[];
    totalRows: number;
    headerRowIndex: number; // Номер строки с заголовками (1-based)
    columnMappings: Map<TRowsKey, number>; // Название колонки -> индекс
}

@Injectable()
export class GoogleSheetsTableService {
    private readonly logger = new Logger(GoogleSheetsTableService.name);

    constructor(private readonly googleSheetsService: GoogleSheetsService) { }

    /**
     * Получение таблицы с фильтрацией по колонкам
     * @param spreadsheetId - ID таблицы
     * @param sheetName - название листа
     * @param columnFilter - фильтр колонок (включить только указанные)
     * @returns ITableData<TKey, TCellData> - отфильтрованные данные
     */
    getFilteredTableData<TKey extends string, TCellData>(
        tableData: IGoogleSheetData,
        columnFilter: string[]
    ): ITableData<TKey, TCellData> {
        const { values } = tableData;

        let headerRowIndex = -1;
        let foundHeaders: Array<{ name: string; index: number }> = [];
        const table: ITableRow<TKey, TCellData>[] = [];

        for (let rowIndex = 0; rowIndex < values.length; rowIndex++) {
            const row = values[rowIndex];

            if (headerRowIndex === -1) {
                // Ищем строку с заголовками
                const rowHeaders: Array<{ name: string; index: number }> = [];
                let allHeadersFound = true;

                columnFilter.forEach(requiredHeader => {
                    const index = row.findIndex(cell => cell === requiredHeader);

                    if (index !== -1) {
                        rowHeaders.push({
                            name: row[index].toString().trim(),
                            index
                        });
                    } else {
                        allHeadersFound = false;
                    }
                });

                if (allHeadersFound && rowHeaders.length === columnFilter.length) {
                    headerRowIndex = rowIndex;
                    foundHeaders = rowHeaders;
                    this.logger.log(`Заголовки найдены в строке ${rowIndex + 1}`);
                }
            } else {
                // После строки с заголовками начинаем строить таблицу
                const isEmptyRow = row.every(cell => cell === null || cell === undefined || cell.toString().trim() === "");
                if (isEmptyRow) {
                    this.logger.log(`Обработка остановлена на строке ${rowIndex + 1} (пустая строка)`);
                    break;
                }

                const cells = new Map<TKey, ITableCellData<TCellData>>();
                foundHeaders.forEach(header => {
                    cells.set(header.name as TKey, {
                        position: {
                            letter: this.indexToColumnLetter(header.index),
                            number: rowIndex + 1 // Номер строки в Google Sheets (1-based)
                        },
                        value: row[header.index]
                    });
                });

                table.push({
                    cells
                });
            }
        }

        if (headerRowIndex === -1) {
            throw new Error(`Заголовки таблицы не найдены. Ищем: ${columnFilter.join(', ')}`);
        }

        this.logger.log(`Таблица успешно построена. Найдено строк: ${table.length}`);

        return {
            rows: table,
            columns: foundHeaders.map(h => ({
                name: h.name,
                index: h.index,
                position: {
                    letter: this.indexToColumnLetter(h.index),
                    number: h.index + 1
                }
            })),
            totalRows: table.length,
            headerRowIndex: headerRowIndex + 1,
            columnMappings: foundHeaders.reduce((acc, header) => {
                acc.set(header.name as TKey, header.index);
                return acc;
            }, new Map<TKey, number>())
        };
    }

    /**
     * Конвертация индекса колонки в букву (0 -> A, 1 -> B, 25 -> Z, 26 -> AA)
     * @param index - индекс колонки (0-based)
     * @returns string - буква колонки
     */
    private indexToColumnLetter(index: number): string {
        let result = '';
        let currentIndex = index;

        while (currentIndex >= 0) {
            result = String.fromCharCode(65 + (currentIndex % 26)) + result;
            currentIndex = Math.floor(currentIndex / 26) - 1;
        }
        return result;
    }
}
