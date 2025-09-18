import { ConfigService } from '@nestjs/config';

export const createGoogleSheetsConfig = (configService: ConfigService) => ({
    // Service Account (рекомендуется для production)
    serviceAccountKey: configService.get('GOOGLE_SERVICE_ACCOUNT_KEY'),

    // API Key (для публичных таблиц)
    apiKey: configService.get('GOOGLE_API_KEY'),

    // OAuth2 (для пользовательских аккаунтов)
    clientId: configService.get('GOOGLE_CLIENT_ID'),
    clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
    redirectUri: configService.get('GOOGLE_REDIRECT_URI'),
    refreshToken: configService.get('GOOGLE_REFRESH_TOKEN'),

    // ID таблицы по умолчанию
    defaultSpreadsheetId: configService.get('GOOGLE_DEFAULT_SPREADSHEET_ID'),

    // Название листа по умолчанию
    defaultSheetName: configService.get('GOOGLE_DEFAULT_SHEET_NAME'),
});
