import { Injectable } from '@nestjs/common';

import { EMoySkladRetailStoreName } from '../moy-sklad/enums';

@Injectable()
export class VapeShopTurnoverCalculatorService {
    calculateAllRetailStoreSalesCountByProductNameMap(productSalesByRetailStoreMap: Map<EMoySkladRetailStoreName, Map<string, number>>) {
        const allRetailStoreSalesCountByProductNameMap = new Map<string, number>();

        for (const retailStore of productSalesByRetailStoreMap.keys()) {
            const retailStoreSalesCountByProductNameMap = productSalesByRetailStoreMap.get(retailStore);

            for (const [productName, salesCount] of retailStoreSalesCountByProductNameMap.entries()) {
                if (allRetailStoreSalesCountByProductNameMap.has(productName)) {
                    allRetailStoreSalesCountByProductNameMap.set(productName, allRetailStoreSalesCountByProductNameMap.get(productName) + salesCount);
                } else {
                    allRetailStoreSalesCountByProductNameMap.set(productName, salesCount);
                }
            }
        }

        return allRetailStoreSalesCountByProductNameMap;
    }
}
