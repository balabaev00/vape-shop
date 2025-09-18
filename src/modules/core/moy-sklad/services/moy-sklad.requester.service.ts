import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

import { TMoySkladCredentials, TMoySkladGetAccessTokenResponse } from '../types';

@Injectable()
export class MoySkladRequesterService implements OnModuleInit {
    private readonly credentials: TMoySkladCredentials;
    private readonly logger = new Logger(MoySkladRequesterService.name);
    private accessToken: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.credentials = {
            username: this.configService.getOrThrow('MOY_SKLAD_USERNAME'),
            password: this.configService.getOrThrow('MOY_SKLAD_PASSWORD'),
        };
    }

    async onModuleInit() {
        this.accessToken = await this.getAccessToken();
    }

    async request<T>(options: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        const { headers, ...otherOptions } = options;
        try {
            const response = await firstValueFrom(this.httpService.request<T>({
                ...otherOptions,
                headers: {
                    ...headers,
                    ...this.createAuthHeaders(this.accessToken),
                },
            }));

            return response;
        } catch (error) {
            this.logger.error('Ошибка при выполнении запроса', {
                error,
                options,
            });

            if (error instanceof AxiosError && error.status === HttpStatus.UNAUTHORIZED) {
                this.accessToken = await this.getAccessToken();

                return this.request(options);
            }

            throw error;
        }
    }

    /**
     * Получение нового токена доступа к API МойСклад
     * @returns Promise<string> - токен доступа
     */
    private async getAccessToken(): Promise<string> {
        try {
            this.logger.log('Запрос на получение токена доступа к API МойСклад');

            const response = await firstValueFrom(
                this.httpService.post<TMoySkladGetAccessTokenResponse>(
                    `api/remap/1.2/security/token`,
                    {},
                    {
                        headers: {
                            Authorization: `Basic ${Buffer.from(`${this.credentials.username}:${this.credentials.password}`).toString('base64')}`,
                            'Accept-Encoding': 'gzip',
                            'Content-Type': 'application/json',
                        },
                    },
                ),
            );

            const { access_token } = response.data;
            this.logger.log('Токен доступа успешно получен');

            return access_token;
        } catch (error) {
            this.logger.error('Ошибка при получении токена доступа', error);
            throw new Error(
                `Не удалось получить токен доступа к API МойСклад: ${error.message}`,
            );
        }
    }

    /**
     * Создание заголовка авторизации с токеном
     * @param token - токен доступа
     * @returns объект с заголовками для авторизации
     */
    private createAuthHeaders(token: string) {
        return {
            Authorization: `Bearer ${token}`,
            'Accept-Encoding': 'gzip',
            'Content-Type': 'application/json',
        };
    }
}
