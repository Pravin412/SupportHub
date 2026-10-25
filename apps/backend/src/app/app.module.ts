import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD } from "@nestjs/core";
import { CryptoService } from "../common/crypto/crypto.service";
import { PrismaService } from "../common/database/prisma.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { EmailProcessor } from "../common/queue/email.processor";
import { WebhookProcessor } from "../common/queue/webhook.processor";
import { AuthModule } from "../features/auth/auth.module";
import { IntegrationsModule } from "../features/integrations/integrations.module";
import { ProjectsModule } from "../features/projects/projects.module";
import { ConversationsModule } from "../features/conversations/conversations.module";
import { TicketsModule } from "../features/tickets/tickets.module";
import { WidgetModule } from "../features/widget/widget.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ global: true }),
    BullModule.forRoot({ connection: { url: process.env.REDIS_URL ?? "redis://localhost:6379" } }),
    BullModule.registerQueue({ name: "webhook" }, { name: "email" }, { name: "notification" }),
    AuthModule,
    ProjectsModule,
    ConversationsModule,
    TicketsModule,
    WidgetModule,
    IntegrationsModule
  ],
  providers: [
    WebhookProcessor,
    EmailProcessor,
    PrismaService,
    CryptoService,
    { provide: APP_GUARD, useClass: JwtAuthGuard }
  ]
})
export class AppModule {}
