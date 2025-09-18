import { Injectable } from '@nestjs/common';

import { TMoySkladRetailStoreList } from '../types';
import { MoySkladRequesterService } from './moy-sklad.requester.service';

@Injectable()
export class MoySkladRetailStoreService {
    constructor(
        private readonly moySkladRequesterService: MoySkladRequesterService,
    ) { }

    async get(): Promise<TMoySkladRetailStoreList> {
        const response = await this.moySkladRequesterService.request<TMoySkladRetailStoreList>({
            method: 'GET',
            url: '/api/remap/1.2/entity/retailstore',
        });

        return response.data;
    }
}
