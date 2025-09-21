import { Injectable } from '@nestjs/common';

interface ISalesReportByAddress {
    address: string;
    salesCountByProductNameMap: Map<string, number>;
}

@Injectable()
export class VapeShopReportMessageService {
    constructor(
    ) { }

    /**
     * Создает таблицу продаж в формате для Telegram
     * @param reports - массив отчетов по точкам продаж
     * @param period - период отчета
     * @returns отформатированное сообщение с таблицей
     */
    createSalesTableMessage(reports: ISalesReportByAddress[], period: string): string {
        // Собираем все уникальные товары
        const allProducts = new Set<string>();
        for (const report of reports) {
            for (const productName of report.salesCountByProductNameMap.keys()) {
                allProducts.add(productName);
            }
        }

        // Создаем заголовок
        let message = `📊 **ОТЧЕТ ПО ПРОДАЖАМ**\n`;
        message += `📅 ${period}\n\n`;

        // Заголовок с адресами
        message += `**ТОВАРЫ ПО АДРЕСАМ:**\n\n`;

        // Для каждого товара показываем продажи по всем адресам
        for (const productName of Array.from(allProducts).sort()) {
            const salesByAddress = reports.map(report => ({
                address: report.address,
                sales: report.salesCountByProductNameMap.get(productName) || 0
            }));

            // Фильтруем только товары с продажами
            const salesWithData = salesByAddress.filter(item => item.sales > 0);

            if (salesWithData.length > 0) {
                message += `**${productName}:**\n`;
                for (const item of salesWithData) {
                    message += `  • ${item.address}: **${item.sales}** шт.\n`;
                }
                message += `\n`;
            }
        }

        return message;
    }


    createReportMessage(
        address: string,
        salesCountByProductNameMap: Map<string, number>,
        date: string,
    ): string {
        let message = `**${address}**\n`;
        message += `📅 ${date}\n\n`;

        if (salesCountByProductNameMap.size > 0) {
            for (const product of salesCountByProductNameMap.entries()) {
                message += `• ${product[0]}: **${product[1]}** шт.\n`;
            }
        } else {
            message += `❌ За указанный период продаж не было\n`;
        }

        return message;
    }
}
