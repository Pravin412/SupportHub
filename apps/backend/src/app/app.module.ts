import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { CryptoService } from "../common/crypto/crypto.service";
import { PrismaService } from "../common/database/prisma.service";
import { WebhookProcessor } from "../common/queue/webhook.processor";
import { AuthModule } from "../features/auth/auth.module";
import { IntegrationsModule } from "../features/integrations/integrations.module";
import { SupportModule } from "../features/support/support.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ global: true }),
    BullModule.forRoot({ connection: { url: process.env.REDIS_URL ?? "redis://localhost:6379" } }),
    BullModule.registerQueue({ name: "webhook" }, { name: "email" }, { name: "notification" }),
    AuthModule,
    SupportModule,
    IntegrationsModule
  ],
  providers: [WebhookProcessor, PrismaService, CryptoService]
})
export class AppModule {}
