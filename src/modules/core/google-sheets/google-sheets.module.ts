import { Module } from '@nestjs/common';

import { GoogleSheetsService } from './services/google-sheets.service';
import { GoogleSheetsTableService } from './services/google-sheets.table.service';

@Module({
    providers: [
        GoogleSheetsService,
        GoogleSheetsTableService,
    ],
    exports: [GoogleSheetsService, GoogleSheetsTableService],
})
export class GoogleSheetsModule { }
