import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ChannelType, LeadStage } from '@prisma/client';

import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../common/prisma.service.js';

function normalizeLeadStage(stage?: string): LeadStage | undefined {
  if (!stage) return undefined;
  if ((Object.values(LeadStage) as string[]).includes(stage)) {
    return stage as LeadStage;
  }
  return undefined;
}

@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getLeads(stage?: string) {
    const normalizedStage = normalizeLeadStage(stage);
    if (stage && !normalizedStage) {
      throw new BadRequestException('Etapa de lead no valida');
    }
    return this.prisma.lead.findMany({
      where: normalizedStage ? { stage: normalizedStage } : undefined,
      include: {
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
      orderBy: { score: 'desc' },
    });
  }

  async createLead(data: {
    customerId?: string;
    source: string;
    channel: ChannelType;
    contactName: string;
    email?: string;
    phone?: string;
    city?: string;
    stage?: string;
    score?: number;
    quotedValue?: number;
    notes?: string;
    assignedToId?: string;
    companyId?: string;
  }, actorId: string) {
    const normalizedStage = normalizeLeadStage(data.stage) ?? LeadStage.NEW;

    const lead = await this.prisma.lead.create({
      data: {
        customerId: data.customerId ?? null,
        companyId: data.companyId ?? null,
        source: data.source,
        channel: data.channel,
        contactName: data.contactName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        city: data.city ?? null,
        stage: normalizedStage,
        score: data.score ?? 0,
        quotedValue: data.quotedValue ?? null,
        notes: data.notes ?? null,
        assignedToId: data.assignedToId ?? null,
      },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    await this.audit.log({
      actorUserId: actorId,
      entityType: 'Lead',
      entityId: lead.id,
      action: 'lead.created',
      metadata: { stage: lead.stage, channel: lead.channel },
    });

    return lead;
  }

  async updateLeadStage(id: string, stage: string, lostReason?: string, actorId?: string) {
    const normalizedStage = normalizeLeadStage(stage);
    if (!normalizedStage) {
      throw new BadRequestException('Etapa de lead no valida');
    }

    const old = await this.prisma.lead.findUniqueOrThrow({ where: { id } });

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        stage: normalizedStage,
        lostReason: normalizedStage === LeadStage.CLOSED_LOST ? (lostReason ?? null) : null,

      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
    });

    await this.audit.log({
      actorUserId: actorId,
      entityType: 'Lead',
      entityId: id,
      action: 'lead.stage_updated',
      metadata: { previousStage: old.stage, newStage: normalizedStage, lostReason: lostReason ?? null },
    });

    return updated;
  }

  async updateLead(id: string, data: {
    score?: number;
    quotedValue?: number;
    notes?: string;
    assignedToId?: string;
    stage?: string;
  }, actorId: string) {
    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        score: data.score,
        quotedValue: data.quotedValue,
        notes: data.notes,
        assignedToId: data.assignedToId,
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
    });

    await this.audit.log({
      actorUserId: actorId,
      entityType: 'Lead',
      entityId: id,
      action: 'lead.updated',
      metadata: { changes: data },
    });

    return updated;
  }

  async getPipelineStats() {
    const stages = Object.values(LeadStage);
    const results = await Promise.all(
      stages.map(async (stage) => {
        const leads = await this.prisma.lead.findMany({ where: { stage } });
        const totalValue = leads.reduce(
          (sum: number, lead) => sum + Number(lead.quotedValue ?? 0),
          0,
        );
        return { stage, count: leads.length, totalValue };
      }),
    );
    return results;
  }

  async getCustomers(search?: string) {
    return this.prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        leads: { select: { stage: true, score: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCustomer(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    notes?: string;
  }, actorId: string) {
    const customer = await this.prisma.customer.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone ?? null,
        notes: data.notes ?? null,
      },
    });
    await this.audit.log({
      actorUserId: actorId,
      entityType: 'Customer',
      entityId: customer.id,
      action: 'customer.created',
    });
    return customer;
  }

  async getConversations(leadId?: string) {
    return this.prisma.conversation.findMany({
      where: leadId ? { leadId } : undefined,
      include: {
        lead: { select: { contactName: true, stage: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
