export type TSalesCountByProductNameMap = {
    salesCount: number;
    productsMap: Map<string, number>;
}

export type TSalesReportByAddress = {
    address: string;
    salesCountByProductNameMap: Map<string, TSalesCountByProductNameMap>;
}

export type TRetailStoreSalesData = {
    totalSalesCount: number;
    productsMap: Map<string, TSalesCountByProductNameMap>;
}

export type TDetailedSalesReport = Map<string, TRetailStoreSalesData>;
