import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import nodemailer from "nodemailer";
import { CryptoService } from "../crypto/crypto.service";
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

  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService
  ) {
    super();
  }

  async process(job: Job<EmailJob>) {
    if (job.data.to?.toLowerCase() === "admin@gmail.com") {
      this.logger.warn(`[email] Skipped sending email to dummy admin email: ${job.data.to}`);
      return;
    }

    const notification = await this.prisma.emailNotification.create({
      data: {
        projectId: job.data.projectId,
        to: job.data.to,
        subject: job.data.subject,
        status: "QUEUED"
      }
    });

    try {
      await this.send(job.data);
      await this.prisma.emailNotification.update({ where: { id: notification.id }, data: { status: "SENT" } });
      this.logger.log(`[email] sent job=${job.id} project=${job.data.projectId} to=${job.data.to}`);
    } catch (error) {
      await this.prisma.emailNotification.update({ where: { id: notification.id }, data: { status: "FAILED" } });
      this.logger.error(
        `[email] failed job=${job.id} project=${job.data.projectId} to=${job.data.to}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  private async send(data: EmailJob) {
    return this.sendWithSmtp(data);
  }

  private async sendWithSmtp(data: EmailJob) {
    const bcc = process.env.BCC_EMAIL;
    
    // Only project-specific SMTP settings are used. No default SMTP fallback.
    const projectSmtp = await this.prisma.projectEmailSettings.findUnique({
      where: { projectId: data.projectId }
    });

    if (!projectSmtp || !projectSmtp.enabled || !projectSmtp.smtpHost || !projectSmtp.smtpUser || !projectSmtp.smtpPassword) {
      this.logger.warn(`[email] Skipped sending email: Project ${data.projectId} has no custom SMTP settings configured.`);
      return;
    }

    const smtpPassword = this.crypto.decryptSecret(projectSmtp.smtpPassword);
    const isPort465 = projectSmtp.smtpPort === 465;
    const secure = isPort465 ? true : projectSmtp.smtpSecure;
    const transporter = nodemailer.createTransport({
      host: projectSmtp.smtpHost,
      port: projectSmtp.smtpPort,
      secure,
      auth: { user: projectSmtp.smtpUser, pass: smtpPassword }
    });

    await transporter.sendMail({
      from: projectSmtp.fromName ? `"${projectSmtp.fromName}" <${projectSmtp.smtpUser}>` : projectSmtp.smtpUser,
      to: data.to,
      bcc,
      subject: data.subject,
      text: data.text ?? data.subject
    });
  }
}
