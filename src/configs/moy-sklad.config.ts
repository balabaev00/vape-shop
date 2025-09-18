import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig } from 'axios';

export const createMoySkladConfig = (configService: ConfigService): AxiosRequestConfig => ({
    baseURL: configService.getOrThrow('MOY_SKLAD_BASE_URL'),
    timeout: configService.getOrThrow('MOY_SKLAD_TIMEOUT'),
});
