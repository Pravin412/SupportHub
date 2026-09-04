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
    private db: PrismaService,
    private crypto: CryptoService
  ) {
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
    const bcc = process.env.BCC_EMAIL;
    
    // First try project-specific SMTP settings
    const projectSmtp = await this.db.projectEmailSettings.findUnique({
      where: { projectId: data.projectId }
    });

    if (projectSmtp && projectSmtp.enabled) {
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
      return;
    }

    // Fallback to global SMTP settings
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const secure = (process.env.SMTP_SECURE ?? String(port === 465)).toLowerCase() === "true";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!host || !user || !pass) {
      throw new Error("SMTP_HOST, SMTP_USER, and SMTP_PASSWORD are required for EMAIL_PROVIDER=smtp");
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from: user,
      to: data.to,
      bcc,
      subject: data.subject,
      text: data.text ?? data.subject
    });
  }
}
