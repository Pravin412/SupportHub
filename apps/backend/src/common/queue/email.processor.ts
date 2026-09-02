import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import nodemailer from "nodemailer";
import { PrismaService } from "../database/prisma.service";

type EmailJob = {
  projectId: string;
  to: string;
  subject: string;
  text?: string;
};

@Processor("email")
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private db: PrismaService) {
    super();
  }

  async process(job: Job<EmailJob>) {
    const notification = await this.db.emailNotification.create({
      data: {
        projectId: job.data.projectId,
        to: job.data.to,
        subject: job.data.subject,
        status: "QUEUED"
      }
    });

    try {
      await this.send(job.data);
      await this.db.emailNotification.update({ where: { id: notification.id }, data: { status: "SENT" } });
      this.logger.log(`[email] sent job=${job.id} project=${job.data.projectId} to=${job.data.to}`);
    } catch (error) {
      await this.db.emailNotification.update({ where: { id: notification.id }, data: { status: "FAILED" } });
      this.logger.error(
        `[email] failed job=${job.id} project=${job.data.projectId} to=${job.data.to}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  private async send(data: EmailJob) {
    const provider = (process.env.EMAIL_PROVIDER ?? "log").toLowerCase();
    if (provider === "smtp") return this.sendWithSmtp(data);

    this.logger.log(`[email:log] to=${data.to} subject="${data.subject}" text="${data.text ?? ""}"`);
  }

  private async sendWithSmtp(data: EmailJob) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_LOGIN_USER;
    const pass = process.env.SMTP_LOGIN_PASSWORD;
    const from = process.env.SMTP_FROM_ADDRESS ?? user;
    const bcc = process.env.BCC_EMAIL;

    if (!host || !user || !pass || !from) {
      throw new Error("SMTP_HOST, SMTP_LOGIN_USER, SMTP_LOGIN_PASSWORD, and SMTP_FROM_ADDRESS are required for EMAIL_PROVIDER=smtp");
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from,
      to: data.to,
      bcc,
      subject: data.subject,
      text: data.text ?? data.subject
    });
  }
}
