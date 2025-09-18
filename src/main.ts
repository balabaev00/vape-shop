import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dayjs from 'dayjs';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import * as utc from 'dayjs/plugin/utc';

import { AppModule } from './app.module';



async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    const stage = configService.get<string>('STAGE');

    if (stage !== 'production') {
        const serviceURL = `${stage === 'development' ? 'http' : 'https'}://${configService.getOrThrow<string>('FQDN')}`;
        const description = [
            'Сервис для работы с деплоями проектов',
            `<a href="${serviceURL}/queues" target="_blank">Админка очередей</a>`,
            `<a href="${serviceURL}/docs/json" target="_blank">Схема API JSON</a>`,
        ].join('\n\n');

        const config = new DocumentBuilder()
            .setTitle('Релизный менеджер')
            .setDescription(description)
            .setVersion('1.0')
            .addBearerAuth()
            .build();

        const document = SwaggerModule.createDocument(app, config);

        SwaggerModule.setup('docs', app, document);
    }

    dayjs.extend(utc);
    dayjs.extend(customParseFormat);
    dayjs.locale('ru');


    await app.listen(3000);
}
bootstrap();
