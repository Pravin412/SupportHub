import { Injectable, Logger } from "@nestjs/common";
import { normalizePhoneNumber, parsePhoneList } from "./phone.utils";
import { CryptoService } from "../crypto/crypto.service";
import { PrismaService } from "../database/prisma.service";

export interface SendWhatsappTemplateArgs {
  projectId: string;
  phoneNumber: string;
  templateName: string;
  language?: string;
  fields?: string[];
}

export interface WhatsappSendResult {
  success: boolean;
  mocked?: boolean;
  message?: string;
  data?: any;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService
  ) {}

  /**
   * Resolves credentials for a project.
   * Each project must explicitly configure its own gateway credentials.
   */
  async getProjectCredentials(projectId: string) {
    const projectSettings = await this.prisma.projectWhatsappSettings.findUnique({
      where: { projectId }
    });

    const customVendor = projectSettings?.vendorId?.trim();
    const customToken = projectSettings?.accessToken?.trim();
    const customUrl = projectSettings?.providerUrl?.trim();

    if (customVendor && customToken) {
      return {
        baseUrl: customUrl || "https://whaps.in/api",
        vendorId: customVendor,
        accessToken: this.crypto.decryptSecret(customToken),
        isCustom: true,
        hasCredentials: true
      };
    }

    // No default fallback - each project must explicitly configure its own credentials
    return {
      baseUrl: customUrl || "https://whaps.in/api",
      vendorId: "",
      accessToken: "",
      isCustom: false,
      hasCredentials: false
    };
  }

  /**
   * Sends a template message to a single phone number
   */
  async sendTemplateMessage(args: SendWhatsappTemplateArgs): Promise<WhatsappSendResult> {
    const rawNumber = args.phoneNumber;
    const cleanNumber = normalizePhoneNumber(undefined, rawNumber) || rawNumber.replace(/\D/g, "");

    if (!cleanNumber || cleanNumber.length < 9) {
      this.logger.warn(`[whatsapp] Invalid phone number skipped: "${rawNumber}"`);
      return { success: false, message: `Invalid recipient phone number: ${rawNumber}` };
    }

    const notification = await this.prisma.whatsappNotification.create({
      data: {
        projectId: args.projectId,
        phoneNumber: cleanNumber,
        templateName: args.templateName,
        status: "QUEUED"
      }
    });

    const credentials = await this.getProjectCredentials(args.projectId);

    // Each project must have its own credentials configured
    if (!credentials.hasCredentials) {
      await this.prisma.whatsappNotification.update({
        where: { id: notification.id },
        data: {
          status: "FAILED",
          errorMessage: "No WhatsApp credentials configured for this project"
        }
      });
      return {
        success: false,
        message: "No WhatsApp credentials configured for this project. Please configure Vendor ID and Access Token in project WhatsApp settings."
      };
    }

    try {
      const url = `${credentials.baseUrl.replace(/\/+$/, "")}/${credentials.vendorId}/contact/send-template-message?token=${credentials.accessToken}`;

      const body: Record<string, any> = {
        phone_number: cleanNumber,
        template_name: args.templateName,
        template_language: args.language || "en_US"
      };

      if (args.fields && args.fields.length > 0) {
        args.fields.forEach((val, idx) => {
          body[`field_${idx + 1}`] = String(val ?? "");
        });
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${credentials.accessToken}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json().catch(() => null);

      const providerFailed = data?.result === "failed" || data?.success === false;
      if (!res.ok || providerFailed) {
        const errorMsg = data?.message || (res.ok ? "WhatsApp provider rejected the message" : `WhatsApp API error ${res.status}`);
        await this.prisma.whatsappNotification.update({
          where: { id: notification.id },
          data: { status: "FAILED", errorMessage: errorMsg }
        });
        this.logger.error(`[whatsapp] API failed to ${cleanNumber}: ${errorMsg}`);
        return { success: false, message: errorMsg, data };
      }

      await this.prisma.whatsappNotification.update({
        where: { id: notification.id },
        data: { status: "SENT" }
      });
      this.logger.log(`[whatsapp] Successfully sent to ${cleanNumber} [${args.templateName}]`);
      return { success: true, message: data?.message || "WhatsApp message accepted for processing", data };
    } catch (err: any) {
      const errorMsg = err?.message || "Unknown network error";
      await this.prisma.whatsappNotification.update({
        where: { id: notification.id },
        data: { status: "FAILED", errorMessage: errorMsg }
      });
      this.logger.error(`[whatsapp] Exception sending to ${cleanNumber}`, err);
      return { success: false, message: errorMsg };
    }
  }

  /**
   * Dispatches WhatsApp notification when a ticket is created
   */
  async sendTicketCreatedNotification(
    projectId: string,
    ticket: { id: string; title: string; priority?: string; status?: string }
  ) {
    const settings = await this.prisma.projectWhatsappSettings.findUnique({
      where: { projectId }
    });

    if (!settings || !settings.enabled || !settings.ticketCreatedEnabled) {
      return;
    }

    const credentials = await this.getProjectCredentials(projectId);
    if (!credentials.hasCredentials) {
      this.logger.debug(
        `[whatsapp] Ticket ${ticket.id} created but WhatsApp credentials are not configured for project ${projectId}. Skipping.`
      );
      return;
    }

    const recipients = parsePhoneList(settings.recipientPhoneNumbers);
    if (!recipients.length) {
      this.logger.debug(`[whatsapp] Ticket ${ticket.id} created but no recipient numbers configured for project ${projectId}`);
      return;
    }

    // Resolve template
    let templateName = "ticket_alert";
    let templateLanguage = "en_US";

    if (settings.ticketCreatedTemplateId) {
      const template = await this.prisma.projectWhatsappTemplate.findFirst({
        where: {
          projectId,
          OR: [
            { id: settings.ticketCreatedTemplateId },
            { name: settings.ticketCreatedTemplateId }
          ]
        }
      });
      if (template) {
        templateName = template.name;
        templateLanguage = template.language;
      } else {
        templateName = settings.ticketCreatedTemplateId;
      }
    } else {
      // Pick first template if available
      const firstTemplate = await this.prisma.projectWhatsappTemplate.findFirst({
        where: { projectId },
        orderBy: { createdAt: "asc" }
      });
      if (firstTemplate) {
        templateName = firstTemplate.name;
        templateLanguage = firstTemplate.language;
      }
    }

    const ticketDetails = await this.prisma.ticket.findUnique({
      where: { id: ticket.id },
      select: {
        title: true,
        status: true,
        priority: true,
        conversation: {
          select: {
            contact: {
              select: {
                name: true,
                phone: true,
                email: true
              }
            }
          }
        }
      }
    });

    const customerName = ticketDetails?.conversation?.contact?.name?.trim() || "Customer";
    const ticketTitle = ticketDetails?.title ?? ticket.title;
    const priorityAndStatus = `${ticketDetails?.priority ?? ticket.priority ?? "MEDIUM"} - ${ticketDetails?.status ?? ticket.status ?? "OPEN"}`;
    const customerEmail = ticketDetails?.conversation?.contact?.email?.trim() || "Not provided";
    const customerPhone = ticketDetails?.conversation?.contact?.phone?.trim() || "Not provided";

    // Standard field mapping:
    // field_1: Customer Name
    // field_2: Email
    // field_3: Phone with priority and status
    // field_4: Message with ticket ID
    const fields = [
      customerName,
      customerEmail,
      `${customerPhone} (${priorityAndStatus})`,
      `${ticketTitle} | Ticket ID: ${ticket.id}`
    ];

    this.logger.log(
      `[whatsapp] Dispatching ticket created alert to ${recipients.length} recipient(s) for ticket=${ticket.id} [template=${templateName}]`
    );

    await Promise.allSettled(
      recipients.map((phone: string) =>
        this.sendTemplateMessage({
          projectId,
          phoneNumber: phone,
          templateName,
          language: templateLanguage,
          fields
        })
      )
    );
  }
}
