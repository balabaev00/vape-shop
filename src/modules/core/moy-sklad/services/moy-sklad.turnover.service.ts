import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';

import { TMoySkladTimezoneHeaders, TMoySkladTurnoverFilters, TMoySkladTurnoverReport } from '../types';
import { MoySkladRequesterService } from './moy-sklad.requester.service';

@Injectable()
export class MoySkladTurnoverService {
    private readonly logger = new Logger(MoySkladTurnoverService.name);
    constructor(private readonly requester: MoySkladRequesterService) { }

    /**
     * Получение отчета "Обороты" по товарам
     * @param filters - фильтры для отчета
     * @param timezoneHeaders - заголовки для работы с таймзонами
     * @returns Promise<TMoySkladTurnoverReport> - отчет по оборотам
     */
    async getTurnoverReport(
        filters: TMoySkladTurnoverFilters,
        timezoneHeaders?: TMoySkladTimezoneHeaders
    ): Promise<TMoySkladTurnoverReport> {

        // Формируем параметры запроса
        const params = new URLSearchParams();

        // Обязательные параметры для корректной работы API
        if (filters.momentFrom) params.append('momentFrom', filters.momentFrom);
        if (filters.momentTo) params.append('momentTo', filters.momentTo);

        // Фильтры по типу документа
        if (filters.type) params.append('filter', `type=${filters.type}`);

        // Фильтры по точкам продаж и складам
        if (filters.retailStore) params.append('filter', `retailStore=${filters.retailStore}`);
        if (filters.store) params.append('filter', `store=${filters.store}`);

        // Параметры пагинации
        if (filters.limit) {
            // Проверяем, что limit в допустимых пределах
            const limit = Math.max(1, Math.min(1000, filters.limit));
            params.append('limit', limit.toString());
        } else {
            params.append('limit', '1000'); // По умолчанию 1000
        }

        if (filters.offset) {
            params.append('offset', Math.max(0, filters.offset).toString());
        }

        // Группировка результатов
        if (filters.groupBy) {
            params.append('groupBy', filters.groupBy);
        } else {
            params.append('groupBy', 'product'); // По умолчанию только товары
        }

        const url = `api/remap/1.2/report/turnover/all?${params.toString()}`;

        try {
            // Подготавливаем заголовки запроса
            const requestOptions: any = {
                url,
                method: 'GET',
            };

            // Добавляем заголовки таймзон, если они переданы
            if (timezoneHeaders) {
                if (timezoneHeaders['X-Lognex-Accept-Timezone']) {
                    requestOptions.headers = {
                        'X-Lognex-Accept-Timezone': timezoneHeaders['X-Lognex-Accept-Timezone']
                    };
                }
            }

            const response = await this.requester.request<TMoySkladTurnoverReport>(requestOptions);

            this.logger.log(`Отчет "Обороты" успешно получен, количество позиций: ${response.data.rows?.length || 0}`);

            // Логируем информацию о заголовках ответа
            if (response.headers?.['x-lognex-content-timezone']) {
                this.logger.log(`Таймзона сервера: ${response.headers['x-lognex-content-timezone']}`);
            }

            return response.data;
        } catch (error) {
            this.logger.error('Ошибка при получении отчета "Обороты"', error);

            if (error instanceof AxiosError && error.response) {
                this.logger.error('Ошибка при получении отчета "Обороты"', error.response.data);
            }

            throw new Error(`Не удалось получить отчет "Обороты": ${error.message}`);
        }
    }
}
