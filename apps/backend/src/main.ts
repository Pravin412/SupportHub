import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app/app.module";
import { ApiExceptionFilter } from "./common/http/api-exception.filter";
import { ApiResponseInterceptor } from "./common/http/api-response.interceptor";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter() as never);
  await app.register(cookie as never);
  await app.register(helmet as never);
  const allowedOrigins = (process.env.WEB_ORIGIN ?? "http://localhost:3000,http://localhost:3001,http://localhost:3002")
    .split(",")
    .map((origin) => origin.trim());
  await app.register(cors as never, {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["authorization", "content-type"]
  });
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const config = new DocumentBuilder().setTitle("SupportHub API").setVersion("0.1.0").addBearerAuth().build();
  const swagger = SwaggerModule as unknown as {
    createDocument: (application: unknown, config: unknown) => unknown;
    setup: (path: string, application: unknown, document: unknown) => void;
  };
  swagger.setup("docs", app, swagger.createDocument(app, config));
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000, "0.0.0.0");
}

bootstrap();
