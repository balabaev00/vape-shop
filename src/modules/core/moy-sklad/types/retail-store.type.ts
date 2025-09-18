// Базовые мета-типы
export type TMoySkladMeta = {
    href: string;
    metadataHref?: string;
    type: string;
    mediaType: string;
    uuidHref?: string;
};

export type TMoySkladMetaPagination = {
    href: string;
    metadataHref?: string;
    type: string;
    mediaType: string;
    size: number;
    limit: number;
    offset: number;
    nextHref?: string;
    previousHref?: string;
};

// Контекст и конфигурация
export type TMoySkladContext = {
    employee: {
        meta: TMoySkladMeta;
    };
};

// Адресные данные
export type TMoySkladAddressFull = {
    postalCode?: string;
    country?: {
        meta: TMoySkladMeta;
        name: string;
    };
    region?: {
        meta: TMoySkladMeta;
        name: string;
    };
    city?: string;
    street?: string;
    house?: string;
    apartment?: string;
    addInfo?: string;
    comment?: string;
};

// Окружение и оборудование
export type TMoySkladEnvironment = {
    device?: string;
    os?: string;
    software?: {
        name: string;
        vendor: string;
        version: string;
    };
    chequePrinter?: {
        vendor: string;
        name: string;
        serial: string;
        fiscalDataVersion: string;
        driver: {
            name: string;
            version: string;
        };
        fiscalMemory: {
            fiscalDataVersion: string;
            fiscalValidityDate: string;
        };
        firmwareVersion: string;
    };
    paymentTerminal?: {
        acquiringType: string;
    };
};

// Состояние точки продаж
export type TMoySkladRetailStoreState = {
    sync?: {
        message: string;
        lastAttempMoment: string;
    };
    lastCheckMoment?: string;
    fiscalMemory?: {
        error?: {
            code: string;
            message: string;
        };
        notSendDocCount?: number;
        notSendFirstDocMoment?: string;
    };
    paymentTerminal?: {
        acquiringType: string;
    };
};

// Последние операции
export type TMoySkladLastOperation = {
    entity: string;
    name: string;
};

// Кассиры
export type TMoySkladCashiers = {
    meta: TMoySkladMetaPagination;
};

// Папки товаров
export type TMoySkladProductFolders = {
    meta: TMoySkladMetaPagination;
};

// Шаблон чека
export type TMoySkladReceiptTemplate = {
    meta: TMoySkladMeta;
};

// Состояние заказа
export type TMoySkladOrderState = {
    meta: TMoySkladMeta;
};

// QR-платежи
export type TMoySkladQRAcquire = {
    meta: TMoySkladMeta;
};

// Основной тип точки продаж
export type TMoySkladRetailStore = {
    meta: TMoySkladMeta;
    id: string;
    accountId: string;
    owner: {
        meta: TMoySkladMeta;
    };
    shared: boolean;
    group: {
        meta: TMoySkladMeta;
    };
    updated: string;
    name: string;
    description?: string;
    externalCode?: string;
    address?: string;
    addressFull?: TMoySkladAddressFull;
    controlShippingStock: boolean;
    onlyInStock?: boolean;
    active: boolean;
    controlCashierChoice: boolean;
    discountEnable: boolean;
    discountMaxPercent?: number;
    priceType: {
        meta: TMoySkladMeta;
        id: string;
        name: string;
        externalCode: string;
    };
    requiredFio?: boolean;
    requiredPhone?: boolean;
    requiredEmail?: boolean;
    requiredBirthdate?: boolean;
    requiredSex?: boolean;
    requiredDiscountCardNumber?: boolean;
    authTokenAttached: boolean;
    cashiers: TMoySkladCashiers;
    organization: {
        meta: TMoySkladMeta;
    };
    store: {
        meta: TMoySkladMeta;
    };
    acquire?: {
        meta: TMoySkladMeta;
    };
    bankPercent?: number;
    issueOrders: boolean;
    sellReserves: boolean;
    lastOperationNames: TMoySkladLastOperation[];
    environment?: TMoySkladEnvironment;
    state?: TMoySkladRetailStoreState;
    ofdEnabled?: boolean;
    priorityOfdSend?: string;
    allowCustomPrice?: boolean;
    allowSellTobaccoWithoutMRC?: boolean;
    tobaccoMrcControlType?: string;
    markingSellingMode?: string;
    sendMarksForCheck?: boolean;
    allowCreateProducts?: boolean;
    allowDeleteReceiptPositions?: boolean;
    syncAgents?: boolean;
    showBeerOnTap?: boolean;
    productFolders?: TMoySkladProductFolders;
    createAgentsTags?: string[];
    filterAgentsTags?: string[];
    printAlways?: boolean;
    receiptTemplate?: TMoySkladReceiptTemplate;
    createPaymentInOnRetailShiftClosing?: boolean;
    createCashInOnRetailShiftClosing?: boolean;
    returnFromClosedShiftEnabled?: boolean;
    enableReturnsWithNoReason?: boolean;
    createOrderWithState?: TMoySkladOrderState;
    reservePrepaidGoods?: boolean;
    defaultTaxSystem?: string;
    orderTaxSystem?: string;
    fiscalType?: string;
    minionToMasterType?: string;
    qrPayEnabled?: boolean;
    idQR?: string;
    qrTerminalId?: string;
    qrAcquire?: TMoySkladQRAcquire;
    qrBankPercent?: number;
};

// Ответ API со списком точек продаж
export type TMoySkladRetailStoreListResponse = {
    context: TMoySkladContext;
    meta: TMoySkladMetaPagination;
    rows: TMoySkladRetailStore[];
};

// Фильтры для запроса точек продаж
export type TMoySkladRetailStoreFilters = {
    limit?: number;
    offset?: number;
    search?: string;
    active?: boolean;
};
