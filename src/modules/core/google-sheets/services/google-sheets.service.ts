import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { Auth, google, sheets_v4 } from 'googleapis';

export interface IGoogleSheetRow {
    [key: string]: string | number | boolean;
}

export interface IGoogleSheetData {
    spreadsheetId: string;
    range: string;
    values: any[][];
    majorDimension: string;
}

@Injectable()
export class GoogleSheetsService {
    private readonly logger = new Logger(GoogleSheetsService.name);
    private auth: Auth.GoogleAuth;
    private sheets: sheets_v4.Sheets;
    private readonly CREDENTIALS_PATH = 'vape-shop-470411-855677a6af2b.json';

    constructor() {
        const credentials = JSON.parse(
            fs.readFileSync(`${__dirname}/../configs/${this.CREDENTIALS_PATH}`, "utf8")
        );

        this.auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    }

    /**
     * Получение данных из Google Sheets
     * @param spreadsheetId - ID таблицы
     * @param range - диапазон (например: 'Sheet1!A1:D10' или 'Sheet1')
     * @returns Promise<IGoogleSheetData> - данные из таблицы
     */
    async getSheetData(spreadsheetId: string, range: string): Promise<IGoogleSheetData> {
        this.logger.log(`Запрос данных из таблицы: ${spreadsheetId}, диапазон: ${range}`);

        if (!this.sheets) {
            throw new Error('Google Sheets API не инициализирован');
        }

        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
            });

            const { data } = response;

            this.logger.log(`Данные успешно получены, количество строк: ${data.values?.length || 0}`);

            return {
                spreadsheetId,
                range,
                values: data.values || [],
                majorDimension: data.majorDimension || 'ROWS'
            };
        } catch (error) {
            this.logger.error(`Ошибка при получении данных из таблицы ${spreadsheetId}`, error);

            throw new Error(`Не удалось получить данные из Google Sheets: ${error.message}`);
        }
    }

    /**
     * Получение данных с преобразованием в объекты
     * @param spreadsheetId - ID таблицы
     * @param range - диапазон (например: 'Sheet1!A1:D10')
     * @returns Promise<IGoogleSheetRow[]> - массив объектов
     */
    async getSheetDataAsObjects(spreadsheetId: string, range: string): Promise<IGoogleSheetRow[]> {
        try {
            const sheetData = await this.getSheetData(spreadsheetId, range);

            if (!sheetData.values || sheetData.values.length === 0) {
                return [];
            }

            // Первая строка - заголовки
            const headers = sheetData.values[0];
            const dataRows = sheetData.values.slice(1);

            // Преобразуем в массив объектов
            const objects = dataRows.map(row => {
                const obj: IGoogleSheetRow = {};
                headers.forEach((header: string, index: number) => {
                    if (header && row[index] !== undefined) {
                        obj[header] = row[index];
                    }
                });
                return obj;
            });

            this.logger.log(`Данные преобразованы в объекты, количество: ${objects.length}`);
            return objects;
        } catch (error) {
            this.logger.error('Ошибка при преобразовании данных в объекты', error);
            throw error;
        }
    }

    /**
     * Получение метаданных таблицы
     * @param spreadsheetId - ID таблицы
     * @returns Promise<any> - метаданные
     */
    async getSpreadsheetMetadata(spreadsheetId: string): Promise<any> {
        try {
            this.logger.log(`Запрос метаданных таблицы: ${spreadsheetId}`);

            if (!this.sheets) {
                throw new Error('Google Sheets API не инициализирован');
            }

            const response = await this.sheets.spreadsheets.get({
                spreadsheetId,
            });

            const { data } = response;

            this.logger.log(`Метаданные получены для таблицы: ${data.properties?.title}`);

            return {
                title: data.properties?.title,
                sheets: data.sheets?.map((sheet: any) => ({
                    title: sheet.properties?.title,
                    sheetId: sheet.properties?.sheetId,
                    gridProperties: sheet.properties?.gridProperties
                })),
                properties: data.properties
            };
        } catch (error) {
            this.logger.error(`Ошибка при получении метаданных таблицы ${spreadsheetId}`, error);
            throw new Error(`Не удалось получить метаданные: ${error.message}`);
        }
    }

    /**
     * Поиск листа по названию
     * @param spreadsheetId - ID таблицы
     * @param sheetName - название листа
     * @returns Promise<string | null> - название листа или null
     */
    async findSheetByName(spreadsheetId: string, sheetName: string): Promise<string | null> {
        try {
            const metadata = await this.getSpreadsheetMetadata(spreadsheetId);
            const sheet = metadata.sheets?.find((s: any) =>
                s.title.toLowerCase() === sheetName.toLowerCase()
            );

            return sheet ? sheet.title : null;
        } catch (error) {
            this.logger.error(`Ошибка при поиске листа ${sheetName}`, error);
            return null;
        }
    }

    /**
     * Получение данных по названию листа
     * @param spreadsheetId - ID таблицы
     * @param sheetName - название листа
     * @returns Promise<IGoogleSheetRow[]> - данные из листа
     */
    async getDataBySheetName(spreadsheetId: string, sheetName: string): Promise<IGoogleSheetRow[]> {
        try {
            const foundSheetName = await this.findSheetByName(spreadsheetId, sheetName);

            if (!foundSheetName) {
                throw new Error(`Лист с названием '${sheetName}' не найден`);
            }

            return await this.getSheetDataAsObjects(spreadsheetId, foundSheetName);
        } catch (error) {
            this.logger.error(`Ошибка при получении данных по названию листа: ${sheetName}`, error);
            throw error;
        }
    }

    /**
     * Запись значения в одну ячейку
     * @param spreadsheetId - ID таблицы
     * @param range - диапазон (например: 'Sheet1!A1' или 'Sheet1!B5')
     * @param value - значение для записи
     * @returns Promise<any> - результат операции
     */
    async updateCell(
        spreadsheetId: string,
        sheetName: string,
        range: string,
        value: any
    ): Promise<any> {
        this.logger.log(`Запись значения в ячейку: ${spreadsheetId}, диапазон: ${range}, значение: ${value}`);

        if (!this.sheets) {
            throw new Error('Google Sheets API не инициализирован');
        }

        try {
            const response = await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!${range}`,
                valueInputOption: 'RAW', // или 'USER_ENTERED' для формул
                requestBody: {
                    values: [[value]]
                }
            });

            this.logger.log(`Значение успешно записано в ячейку: ${sheetName}!${range}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Ошибка при записи в ячейку ${sheetName}!${range}`, error);

            throw new Error(`Не удалось записать значение в Google Sheets: ${error.message}`);
        }
    }
}
