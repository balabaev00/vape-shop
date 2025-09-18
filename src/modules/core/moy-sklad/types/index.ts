export type TMoySkladCredentials = {
    username: string;
    password: string;
};

export type TMoySkladGetAccessTokenResponse = {
    access_token: string;
};

export type TMoySkladMetaPagination = {
    href: string;           // URL для получения данных с текущими параметрами
    type: string;           // Тип отчета (например, "turnover" - оборот)
    mediaType: string;      // MIME-тип ответа (обычно "application/json")
    size: number;           // Общее количество записей в результате
    limit: number;          // Максимальное количество записей на страницу (1-1000)
    offset: number;         // Смещение от начала для текущей страницы
}

// Типы для отчета "Обороты"
export type TMoySkladAssortment = {
    meta: {
        href: string;
        type: string;
        mediaType: string;
        uuidHref?: string;
    };
    name: string;
    code?: string;
    article?: string;
    productFolder?: {
        meta: {
            href: string;
            type: string;
            mediaType: string;
        };
        name: string;
    };
    uom?: {
        meta: {
            href: string;
            type: string;
            mediaType: string;
        };
        name: string;
    };
};

export type TMoySkladIndicators = {
    sum: number;
    quantity: number;
};

export type TMoySkladTurnoverReportItem = {
    assortment: TMoySkladAssortment;
    onPeriodStart: TMoySkladIndicators;
    onPeriodEnd: TMoySkladIndicators;
    income: TMoySkladIndicators;
    outcome: TMoySkladIndicators;
};

export type TMoySkladTurnoverReport = {
    rows: TMoySkladTurnoverReportItem[];
    meta: TMoySkladMetaPagination;
};

// Типы для фильтров
export type TMoySkladTurnoverFilters = {
    momentFrom?: string; // формат: YYYY-MM-DD HH:mm:ss
    momentTo?: string; // формат: YYYY-MM-DD HH:mm:ss
    type?: 'demand' | 'retaildemand'; // тип документа (продажа)
    retailStore?: string; // ссылка на точку продаж
    store?: string; // ссылка на склад
    limit?: number; // 1-1000, по умолчанию 1000
    offset?: number; // по умолчанию 0
    groupBy?: 'product' | 'variant'; // по умолчанию 'product'
};

// Типы для заголовков таймзон
export type TMoySkladTimezoneHeaders = {
    'X-Lognex-Accept-Timezone'?: string; // RFC 3522 формат: Wed, 16 Aug 2017 23:07:01 +0700
    'X-Lognex-Content-Timezone'?: string; // Заголовок ответа
};

// Типы для точек продаж
export type TMoySkladRetailStore = {
    meta: {
        href: string;
        type: string;
        mediaType: string;
        uuidHref?: string;
    };
    id: string;
    name: string;
    code?: string;
    externalCode?: string;
    archived: boolean;
    address?: string;
    addressFull?: {
        addInfo?: string;
        apartment?: string;
        city?: string;
        comment?: string;
        country?: {
            meta: {
                href: string;
                type: string;
                mediaType: string;
            };
            name: string;
        };
        house?: string;
        postalCode?: string;
        region?: {
            meta: {
                href: string;
                type: string;
                mediaType: string;
            };
            name: string;
        };
        street?: string;
    };
    phone?: string;
    email?: string;
    timezone?: string;
    priceType?: {
        meta: {
            href: string;
            type: string;
            mediaType: string;
        };
        name: string;
    };
    organization?: {
        meta: {
            href: string;
            type: string;
            mediaType: string;
        };
        name: string;
    };
    store?: {
        meta: {
            href: string;
            type: string;
            mediaType: string;
        };
        name: string;
    };
    created: string;
    updated: string;
};

export type TMoySkladRetailStoreList = {
    meta: {
        href: string;
        type: string;
        mediaType: string;
        size: number;
        limit: number;
        offset: number;
        nextHref?: string;
        previousHref?: string;
    };
    context: {
        employee: {
            meta: {
                href: string;
                type: string;
                mediaType: string;
            };
        };
    };
    rows: TMoySkladRetailStore[];
};

// Типы для фильтров точек продаж
export type TMoySkladRetailStoreFilters = {
    limit?: number; // 1-1000, по умолчанию 1000
    offset?: number; // по умолчанию 0
};

// Типы для расчета эффективности
export type TTargetProduct = {
    name: string;
    category: string;
    isTarget: boolean;
};

export type TSalesEfficiency = {
    date: string;
    retailStore: string;
    totalSales: number;
    targetSales: number;
    efficiencyPercentage: number;
    employeeId?: string;
    employeeName?: string;
};
