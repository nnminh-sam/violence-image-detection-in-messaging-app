import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ResponseTransformInterceptor } from './interceptor/response-transform.interceptor';
import { GlobalHttpExceptionFilter } from './helper/filter/global-exception.filter';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ApiLoggingInterceptor } from './interceptor/api-logging.interceptor';

dotenv.config();

async function bootstrap() {
  const runningMode: string = process.env.MODE;

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: runningMode === 'dev' ? '*' : process.env.CLIENT,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*',
  });
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
      whitelist: true,
      exceptionFactory: (errors) => {
        const result = errors.map((error) => ({
          property: error.property,
          value: error.value,
          message: error.constraints[Object.keys(error.constraints)[0]],
        }));
        return new BadRequestException(result);
      },
    }),
  );
  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  app.useGlobalInterceptors(new ApiLoggingInterceptor());
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  await app.listen(process.env.PORT);
}
bootstrap();
