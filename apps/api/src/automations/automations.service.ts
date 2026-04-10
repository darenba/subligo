import { Injectable } from '@nestjs/common';
import {
  AutomationStatus,
  AutomationTriggerType,
  ChannelType,
  ConversationIntent,
  LeadStage,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';

import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../common/prisma.service.js';

const REACTIVATION_AUTOMATION_NAME = 'Reactivacion 90 dias';
const REACTIVATION_SUBJECT = 'Reactivacion automatica de cuenta';
const REACTIVATION_THRESHOLD_DAYS = 90;

@Injectable()
export class AutomationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listAutomations() {
    const automations = await this.prisma.automation.findMany({
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return automations.map((automation) => ({
      id: automation.id,
      name: automation.name,
      description: automation.description,
      status: automation.status,
      triggerType: automation.triggerType,
      approvalRequired: automation.approvalRequired,
      riskLevel: automation.riskLevel,
      lastRunAt: automation.lastRunAt,
      createdAt: automation.createdAt,
      updatedAt: automation.updatedAt,
      tasksCount: automation._count.tasks,
      recentTasks: automation.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        createdAt: task.createdAt,
      })),
    }));
  }

  async runReactivationFlow(actorUserId?: string) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - REACTIVATION_THRESHOLD_DAYS);

    const automation = await this.ensureReactivationAutomation(actorUserId);
    const customers = await this.prisma.customer.findMany({
      where: {
        totalOrders: {
          gt: 0,
        },
      },
      include: {
        orders: {
          orderBy: [{ placedAt: 'desc' }, { createdAt: 'desc' }],
          take: 1,
        },
        leads: {
          where: {
            stage: {
              notIn: [LeadStage.CLOSED_WON, LeadStage.CLOSED_LOST],
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { totalLifetimeValue: 'desc' },
      take: 20,
    });

    const eligibleCustomers = customers.filter((customer) => {
      const lastOrder = customer.orders[0];
      const lastOrderAt = lastOrder?.placedAt ?? lastOrder?.createdAt;
      return Boolean(lastOrderAt && lastOrderAt < cutoff);
    });

    let leadsCreated = 0;
    let tasksCreated = 0;
    let conversationsCreated = 0;
    let messagesCreated = 0;

    for (const customer of eligibleCustomers) {
      const lastOrder = customer.orders[0];
      const lastOrderAt = lastOrder?.placedAt ?? lastOrder?.createdAt;
      if (!lastOrderAt) {
        continue;
      }

      const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim();
      let lead = customer.leads[0] ?? null;

      if (!lead) {
        lead = await this.prisma.lead.create({
          data: {
            customerId: customer.id,
            source: 'Automation Reactivacion',
            channel: ChannelType.EMAIL,
            contactName: fullName || customer.email,
            email: customer.email,
            phone: customer.phone ?? null,
            stage: LeadStage.NEW,
            score: 58,
            city: null,
            notes: `Cuenta reactivable detectada por automation tras ${REACTIVATION_THRESHOLD_DAYS}+ dias sin compra.`,
          },
        });
        leadsCreated += 1;
      }

      const existingTask = await this.prisma.task.findFirst({
        where: {
          automationId: automation.id,
          leadId: lead.id,
          status: {
            in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
          },
        },
      });

      if (!existingTask) {
        await this.prisma.task.create({
          data: {
            automationId: automation.id,
            leadId: lead.id,
            createdById: actorUserId ?? null,
            title: `Reactivar cuenta: ${fullName || customer.email}`,
            description: `Ultima compra registrada el ${lastOrderAt.toISOString().slice(0, 10)}. Preparar oferta de retorno y contacto por email.`,
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            metadata: {
              source: 'automation-reactivation',
              customerId: customer.id,
              lastOrderAt: lastOrderAt.toISOString(),
            },
          },
        });
        tasksCreated += 1;
      }

      let conversation = await this.prisma.conversation.findFirst({
        where: {
          customerId: customer.id,
          leadId: lead.id,
          channel: ChannelType.EMAIL,
          subject: REACTIVATION_SUBJECT,
        },
        include: {
          messages: {
            take: 1,
          },
        },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            customerId: customer.id,
            leadId: lead.id,
            assignedToId: actorUserId ?? null,
            channel: ChannelType.EMAIL,
            intent: ConversationIntent.FOLLOW_UP,
            subject: REACTIVATION_SUBJECT,
            messages: {
              create: {
                direction: 'OUTBOUND',
                senderName: 'SubliGo Automation',
                content: `Hola ${fullName || customer.email}, vimos que hace tiempo no trabajamos juntos. Tenemos nuevas propuestas de branding y produccion que podrian ayudarte este mes. Si quieres, te preparo una recomendacion puntual segun tu historial.`,
              },
            },
          },
          include: {
            messages: {
              take: 1,
            },
          },
        });
        conversationsCreated += 1;
        messagesCreated += 1;
      }
    }

    await this.prisma.automation.update({
      where: { id: automation.id },
      data: {
        status: AutomationStatus.ACTIVE,
        lastRunAt: new Date(),
        config: {
          flow: 'reactivation-90-days',
          thresholdDays: REACTIVATION_THRESHOLD_DAYS,
          lastEligibleCount: eligibleCustomers.length,
        },
      },
    });

    await this.audit.log({
      actorUserId,
      entityType: 'Automation',
      entityId: automation.id,
      action: 'automation.reactivation.executed',
      metadata: {
        eligibleCustomers: eligibleCustomers.length,
        leadsCreated,
        tasksCreated,
        conversationsCreated,
        messagesCreated,
      },
    });

    return {
      automationId: automation.id,
      automationName: automation.name,
      eligibleCustomers: eligibleCustomers.length,
      leadsCreated,
      tasksCreated,
      conversationsCreated,
      messagesCreated,
    };
  }

  private async ensureReactivationAutomation(actorUserId?: string) {
    const existing = await this.prisma.automation.findFirst({
      where: { name: REACTIVATION_AUTOMATION_NAME },
      orderBy: { createdAt: 'asc' },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.automation.create({
      data: {
        createdById: actorUserId ?? null,
        name: REACTIVATION_AUTOMATION_NAME,
        description: 'Detecta cuentas sin compra reciente y genera accion comercial trazable.',
        status: AutomationStatus.ACTIVE,
        triggerType: AutomationTriggerType.TIME_EVENT,
        config: {
          flow: 'reactivation-90-days',
          thresholdDays: REACTIVATION_THRESHOLD_DAYS,
        },
        riskLevel: 'MEDIUM',
        approvalRequired: true,
      },
    });
  }
}
