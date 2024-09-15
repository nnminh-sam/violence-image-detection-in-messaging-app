import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ResponseTransformInterceptor } from './helper/interceptor/response-transform.interceptor';
import { GlobalHttpExceptionFilter } from './helper/filter/global-exception.filter';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  await app.listen(process.env.PORT);
}
bootstrap();
