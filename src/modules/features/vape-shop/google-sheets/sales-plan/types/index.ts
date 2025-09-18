import { ITableData } from '@src/modules/core/google-sheets';
import * as dayjs from 'dayjs';

import { EGoogleSheetsSalePlanColumnName } from '../enums';

export type TSalesPlanTable = ITableData<EGoogleSheetsSalePlanColumnName, string | number>;

// Базовые типы для колонок таблицы продаж
export interface ISalesPlanColumn {
    name: string;
    key: keyof TSalesPlanRow;
    required: boolean;
}

// Константы названий колонок


// Тип для строки таблицы продаж
export type TSalesPlanRow = Map<EGoogleSheetsSalePlanColumnName, string | number>;

export type TSalesPeriod = {
    startDate: dayjs.Dayjs;
    endDate: dayjs.Dayjs;
}

// Тип для таблицы продаж
export interface ISalesPlanTable {
    rows: TSalesPlanRow[];
    totalPlan: number;
    totalSold: number;
    totalRemaining: number;
    averageCompletion: number;
    summary: {
        completed: number; // товары с выполнением >= 100%
        inProgress: number; // товары с выполнением 50-99%
        behind: number; // товары с выполнением < 50%
    };
}

// Тип для фильтрации товаров
export interface ISalesPlanFilter {
    minCompletionPercent?: number;
    maxCompletionPercent?: number;
    productNameContains?: string;
    excludeCompleted?: boolean; // исключить товары с выполнением >= 100%
}

// Тип для анализа эффективности
export interface ISalesPlanAnalysis {
    date: string;
    retailStore: string;
    table: ISalesPlanTable;
    recommendations: string[];
    priorityProducts: TSalesPlanRow[]; // товары, требующие внимания
}
