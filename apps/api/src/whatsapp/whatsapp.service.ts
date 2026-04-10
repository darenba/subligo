import { Injectable } from '@nestjs/common';
import { ChannelType, MessageDirection } from '@prisma/client';

import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../common/prisma.service.js';

@Injectable()
export class WhatsappService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  getConfigurationStatus() {
    return {
      verifyTokenConfigured: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
      accessTokenConfigured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
      appSecretConfigured: Boolean(process.env.WHATSAPP_APP_SECRET),
    };
  }

  async handleInbound(payload: Record<string, any>) {
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (!message || !contact) {
      return { received: true, ignored: true };
    }

    const phone = contact.wa_id ?? message.from;
    const lead =
      (await this.prisma.lead.findFirst({
        where: { phone },
      })) ??
      (await this.prisma.lead.create({
        data: {
          source: 'WhatsApp inbound',
          channel: ChannelType.WHATSAPP,
          contactName: contact.profile?.name ?? phone,
          phone,
          score: 55,
        },
      }));

    const conversation =
      (await this.prisma.conversation.findFirst({
        where: {
          leadId: lead.id,
          channel: ChannelType.WHATSAPP,
          isOpen: true,
        },
      })) ??
      (await this.prisma.conversation.create({
        data: {
          leadId: lead.id,
          channel: ChannelType.WHATSAPP,
          externalThreadId: phone,
        },
      }));

    const createdMessage = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: MessageDirection.INBOUND,
        senderName: contact.profile?.name ?? phone,
        externalId: message.id,
        content: message.text?.body ?? '[unsupported-message]',
      },
    });

    await this.auditService.log({
      entityType: 'Message',
      entityId: createdMessage.id,
      action: 'whatsapp.inbound_message',
      metadata: {
        leadId: lead.id,
        conversationId: conversation.id,
      },
    });

    return { received: true, leadId: lead.id, conversationId: conversation.id };
  }
}
