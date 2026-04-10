import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AgentMode as PrismaAgentMode,
  AgentRunStatus,
  ArtworkStatus,
  CampaignChannel,
  CampaignStatus,
  ChannelType,
  ConversationIntent,
  LeadStage,
  OrderStatus,
  PaymentStatus,
  TaskPriority,
  TaskStatus,
  type Prisma,
} from '@prisma/client';
import {
  AI_AGENTS,
  AI_AGENT_IDS,
  buildAgentFindingDraft,
  buildAgentRunDraft,
  getAgentDefinition,
  getDefaultPromptForAgent,
  type AgentFindingDraft,
  type AgentId,
} from '@printos/ai-agents';

import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../common/prisma.service.js';
import {
  listResolvedAgentPrompts,
  resolveActivePromptForAgent,
  updateAgentPromptOverride,
} from './agent-prompt-store.js';

const INITIAL_AGENT_WAVE = [
  'prospectador-local',
  'escucha-social',
  'ejecutivo-comercial',
] as const satisfies readonly AgentId[];

const PHASE_TWO_AGENT_WAVE = [
  'prospectador-local',
  'escucha-social',
  'ejecutivo-comercial',
  'community-manager',
  'analista-campanas',
  'coordinador-operativo',
  'analista-financiero',
] as const satisfies readonly AgentId[];

const COMMUNITY_MANAGER_CHANNELS = [
  CampaignChannel.INSTAGRAM,
  CampaignChannel.FACEBOOK,
  CampaignChannel.WHATSAPP,
] as const;

type AgentExecutionOutput = {
  summary: string;
  findingsCreated: number;
  analyzedRecords: number;
  promptKey: string;
  finalStatus?: AgentRunStatus;
  details?: Record<string, unknown>;
};

type ReviewDecision = 'APPROVED' | 'REJECTED';
type WaveName = 'initial' | 'phase-two';

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listDefinitions() {
    return AI_AGENTS.map((agent) => ({
      id: agent.id,
      name: agent.label,
      objective: agent.objective,
      defaultMode: agent.defaultMode,
      humanApprovalRequired: agent.approvalRequiredFor.length > 0,
      dataSources: [...agent.dataSources],
      promptKeys: [agent.defaultPromptKey],
      kpis: [...agent.successSignals],
      traceability: {
        runTable: 'agent_runs',
        findingTable: 'agent_findings',
        signalTable: agent.writesTo.includes('social_signals') ? 'social_signals' : undefined,
      },
    }));
  }

  async listRuns(agentId?: string, limit = 20) {
    const normalizedAgentId = this.normalizeAgentId(agentId);

    return this.prisma.agentRun.findMany({
      where: normalizedAgentId ? { agentName: normalizedAgentId } : undefined,
      include: {
        findings: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: this.normalizeLimit(limit),
    });
  }

  async getRun(id: string) {
    const run = await this.prisma.agentRun.findUnique({
      where: { id },
      include: {
        findings: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!run) {
      throw new NotFoundException(`Agent run ${id} no encontrado`);
    }

    return run;
  }

  async listFindings(agentId?: string, limit = 20) {
    const normalizedAgentId = this.normalizeAgentId(agentId);

    return this.prisma.agentFinding.findMany({
      where: normalizedAgentId
        ? {
            agentRun: {
              agentName: normalizedAgentId,
            },
          }
        : undefined,
      include: {
        agentRun: {
          select: {
            id: true,
            agentName: true,
            mode: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: this.normalizeLimit(limit),
    });
  }

  async listReviewQueue(limit = 20) {
    const findings = await this.prisma.agentFinding.findMany({
      include: {
        agentRun: {
          select: {
            id: true,
            agentName: true,
            mode: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.max(12, this.normalizeLimit(limit, 50) * 3),
    });

    return findings
      .filter((finding) => this.requiresHumanReview(finding.payload))
      .slice(0, this.normalizeLimit(limit, 50));
  }

  async listPrompts(agentId?: string) {
    const normalizedAgentId = this.normalizeAgentId(agentId);

    const prompts = await listResolvedAgentPrompts(normalizedAgentId);

    return prompts.map((prompt) => ({
      key: prompt.key,
      agentId: prompt.agentId,
      version: prompt.version,
      baseVersion: prompt.baseVersion,
      purpose: prompt.purpose,
      systemPrompt: prompt.systemPrompt,
      userPromptTemplate: prompt.userPromptTemplate,
      requiresHumanApproval: prompt.requiresHumanApproval,
      variables: prompt.variables,
      updatedAt: prompt.updatedAt,
      updatedById: prompt.updatedById,
      isCustomized: prompt.isCustomized,
      history: prompt.history,
    }));
  }

  async updatePrompt(
    promptKey: string,
    data: {
      purpose?: string;
      systemPrompt?: string;
      userPromptTemplate?: string;
      version?: string;
      note?: string;
    },
    actorUserId?: string,
  ) {
    const prompt = await updateAgentPromptOverride(promptKey, data, actorUserId);

    await this.audit.log({
      actorUserId,
      entityType: 'AgentPrompt',
      entityId: prompt.key,
      action: 'agent.prompt.updated',
      metadata: {
        agentId: prompt.agentId,
        version: prompt.version,
        isCustomized: prompt.isCustomized,
      },
    });

    return {
      key: prompt.key,
      agentId: prompt.agentId,
      version: prompt.version,
      baseVersion: prompt.baseVersion,
      purpose: prompt.purpose,
      systemPrompt: prompt.systemPrompt,
      userPromptTemplate: prompt.userPromptTemplate,
      requiresHumanApproval: prompt.requiresHumanApproval,
      variables: prompt.variables,
      updatedAt: prompt.updatedAt,
      updatedById: prompt.updatedById,
      isCustomized: prompt.isCustomized,
      history: prompt.history,
    };
  }

  async listSocialSignals(limit = 20) {
    return this.prisma.socialSignal.findMany({
      orderBy: { detectedAt: 'desc' },
      take: this.normalizeLimit(limit),
    });
  }

  async reviewFinding(
    findingId: string,
    decision: ReviewDecision,
    reviewerId?: string,
    note?: string,
  ) {
    const finding = await this.prisma.agentFinding.findUnique({
      where: { id: findingId },
      include: {
        agentRun: {
          select: {
            id: true,
            agentName: true,
            mode: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!finding) {
      throw new NotFoundException(`Agent finding ${findingId} no encontrado`);
    }

    if (!this.requiresHumanReview(finding.payload)) {
      throw new BadRequestException('Este hallazgo no requiere aprobacion humana');
    }

    const payload = this.asRecord(finding.payload) ?? {};
    const reviewPayload = {
      ...(this.asRecord(payload['review']) ?? {}),
      status: decision,
      reviewedAt: new Date().toISOString(),
      reviewerId: reviewerId ?? null,
      note: note?.trim() || null,
    };

    const updatedFinding = await this.prisma.agentFinding.update({
      where: { id: findingId },
      data: {
        payload: {
          ...payload,
          review: reviewPayload,
        } as Prisma.InputJsonValue,
      },
      include: {
        agentRun: {
          select: {
            id: true,
            agentName: true,
            mode: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    await this.syncReviewSideEffects(updatedFinding.payload, decision, note);
    await this.syncRunReviewState(updatedFinding.agentRunId, reviewerId);

    await this.audit.log({
      actorUserId: reviewerId,
      entityType: 'AgentFinding',
      entityId: updatedFinding.id,
      action: `agent.finding.${decision.toLowerCase()}`,
      metadata: {
        agentName: updatedFinding.agentRun.agentName,
        findingType: updatedFinding.type,
        note: note ?? null,
      },
    });

    return updatedFinding;
  }

  async executeInitialWave(actorUserId?: string) {
    return this.executeWave('initial', INITIAL_AGENT_WAVE, actorUserId);
  }

  async executePhaseTwoWave(actorUserId?: string) {
    return this.executeWave('phase-two', PHASE_TWO_AGENT_WAVE, actorUserId);
  }

  async executeAgent(params: {
    agentId: string;
    actorUserId?: string;
    mode?: string;
    input?: Record<string, unknown>;
  }) {
    const agentId = this.ensureAgentId(params.agentId);
    const requestedMode = this.normalizeMode(params.mode);
    const activePrompt = await resolveActivePromptForAgent(agentId);
    const runDraft = buildAgentRunDraft(
      agentId,
      {
        ...(params.input ?? {}),
        __prompt: {
          key: activePrompt.key,
          version: activePrompt.version,
        },
      },
      {
      createdById: params.actorUserId,
      mode: requestedMode ?? getAgentDefinition(agentId).defaultMode,
      },
    );

    const run = await this.prisma.agentRun.create({
      data: {
        agentName: runDraft.agentName,
        mode: runDraft.mode as PrismaAgentMode,
        status: AgentRunStatus.RUNNING,
        input: (runDraft.input ?? {}) as Prisma.InputJsonValue,
        createdById: runDraft.createdById ?? null,
        startedAt: new Date(),
      },
    });

    try {
      const output = await this.executeByAgentId(run.id, agentId, params.input ?? {});

      const completedRun = await this.prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: output.finalStatus ?? AgentRunStatus.COMPLETED,
          output: output as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
        include: {
          findings: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      await this.audit.log({
        actorUserId: params.actorUserId,
        entityType: 'AgentRun',
        entityId: run.id,
        action: 'agent.run.completed',
        metadata: {
          agentId,
          findingsCreated: output.findingsCreated,
          analyzedRecords: output.analyzedRecords,
          finalStatus: output.finalStatus ?? AgentRunStatus.COMPLETED,
        },
      });

      return completedRun;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Agent execution failed';

      await this.prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: AgentRunStatus.FAILED,
          errorMessage: message,
          completedAt: new Date(),
        },
      });

      await this.audit.log({
        actorUserId: params.actorUserId,
        entityType: 'AgentRun',
        entityId: run.id,
        action: 'agent.run.failed',
        metadata: {
          agentId,
          error: message,
        },
      });

      throw error;
    }
  }

  private async executeByAgentId(
    runId: string,
    agentId: AgentId,
    input: Record<string, unknown>,
  ): Promise<AgentExecutionOutput> {
    switch (agentId) {
      case 'prospectador-local':
        return this.runProspectadorLocal(runId, input);
      case 'escucha-social':
        return this.runEscuchaSocial(runId, input);
      case 'ejecutivo-comercial':
        return this.runEjecutivoComercial(runId, input);
      case 'community-manager':
        return this.runCommunityManager(runId, input);
      case 'analista-campanas':
        return this.runAnalistaCampanas(runId, input);
      case 'coordinador-operativo':
        return this.runCoordinadorOperativo(runId, input);
      case 'analista-financiero':
        return this.runAnalistaFinanciero(runId, input);
      default:
        throw new BadRequestException(`El agente ${agentId} aun no tiene ejecucion conectada`);
    }
  }

  private async executeWave(
    wave: WaveName,
    agentIds: readonly AgentId[],
    actorUserId?: string,
  ) {
    const runs = [];
    const failures: { agentId: AgentId; message: string }[] = [];

    for (const agentId of agentIds) {
      try {
        runs.push(
          await this.executeAgent({
            agentId,
            actorUserId,
            input: {},
          }),
        );
      } catch (error) {
        failures.push({
          agentId,
          message: error instanceof Error ? error.message : 'Agent execution failed',
        });
      }
    }

    return {
      executed: runs.length,
      failed: failures.length,
      failures,
      runs,
      status: failures.length > 0 ? 'PARTIAL' : 'COMPLETED',
      wave,
    };
  }

  private async runProspectadorLocal(
    runId: string,
    input: Record<string, unknown>,
  ): Promise<AgentExecutionOutput> {
    const city = typeof input['city'] === 'string' ? input['city'].trim() : undefined;
    const limit = this.normalizeLimit(input['limit']);

    const openLeads = await this.prisma.lead.findMany({
      where: {
        stage: {
          notIn: [LeadStage.CLOSED_WON, LeadStage.CLOSED_LOST],
        },
        ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
      },
      include: {
        company: {
          select: { name: true, industry: true, city: true },
        },
        customer: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    const reactivationAccounts = await this.prisma.customer.findMany({
      where: {
        totalOrders: { gt: 0, lte: 2 },
        companyId: { not: null },
      },
      include: {
        company: {
          select: { name: true, industry: true, city: true },
        },
      },
      orderBy: [{ totalOrders: 'asc' }, { totalLifetimeValue: 'desc' }],
      take: Math.max(1, Math.floor(limit / 2)),
    });

    const findings: AgentFindingDraft[] = [];

    for (const lead of openLeads) {
      const keywords = this.collectKeywords([
        lead.source,
        lead.city ?? '',
        this.stringifyUnknownArray(lead.interests).join(' '),
        lead.notes ?? '',
        lead.company?.industry ?? '',
      ]);
      const suggestedOffer = await this.pickSuggestedOffer(keywords.join(' '));
      findings.push(
        buildAgentFindingDraft({
          type: 'local-opportunity',
          title: `${lead.contactName} listo para seguimiento comercial`,
          description:
            `Lead ${lead.stage} por ${lead.channel} con score ${lead.score}. ` +
            `Oferta sugerida: ${suggestedOffer.name}.`,
          priority: this.priorityFromScore(lead.score),
          score: lead.score,
          entityType: 'Lead',
          entityId: lead.id,
          payload: {
            city: lead.city,
            source: lead.source,
            channel: lead.channel,
            company: lead.company?.name ?? null,
            suggestedOfferId: suggestedOffer.id,
            suggestedOfferSlug: suggestedOffer.slug,
            suggestedOfferName: suggestedOffer.name,
            promptKey: getDefaultPromptForAgent('prospectador-local').key,
          },
        }),
      );
    }

    for (const customer of reactivationAccounts) {
      const companyName = customer.company?.name ?? `${customer.firstName} ${customer.lastName}`;
      findings.push(
        buildAgentFindingDraft({
          type: 'reactivation-opportunity',
          title: `${companyName} puede reactivarse con una propuesta local`,
          description:
            `Cuenta con ${customer.totalOrders} pedido(s) historico(s) y valor acumulado ` +
            `de L ${Number(customer.totalLifetimeValue).toFixed(2)}.`,
          priority: 'MEDIUM',
          score: Math.min(90, 45 + customer.totalOrders * 10),
          entityType: 'Customer',
          entityId: customer.id,
          payload: {
            company: customer.company?.name ?? null,
            city: customer.company?.city ?? null,
            industry: customer.company?.industry ?? null,
            totalOrders: customer.totalOrders,
            totalLifetimeValue: Number(customer.totalLifetimeValue),
          },
        }),
      );
    }

    if (!findings.length) {
      findings.push(
        buildAgentFindingDraft({
          type: 'local-opportunity',
          title: 'Sin oportunidades locales nuevas en esta corrida',
          description:
            'No se detectaron leads abiertos ni cuentas reactivables con los filtros actuales.',
          priority: 'LOW',
          payload: {
            city: city ?? null,
          },
        }),
      );
    }

    await this.persistFindings(runId, findings);

    return {
      summary: 'Prospectador local ejecutado sobre CRM y cuentas del negocio.',
      findingsCreated: findings.length,
      analyzedRecords: openLeads.length + reactivationAccounts.length,
      promptKey: getDefaultPromptForAgent('prospectador-local').key,
      details: {
        city: city ?? 'all',
        openLeads: openLeads.length,
        reactivationAccounts: reactivationAccounts.length,
      },
    };
  }

  private async runEscuchaSocial(
    runId: string,
    input: Record<string, unknown>,
  ): Promise<AgentExecutionOutput> {
    const limit = this.normalizeLimit(input['limit']);
    const conversations = await this.prisma.conversation.findMany({
      where: {
        channel: {
          in: [
            ChannelType.WHATSAPP,
            ChannelType.INSTAGRAM,
            ChannelType.FACEBOOK,
            ChannelType.WEB_CHAT,
            ChannelType.EMAIL,
          ],
        },
      },
      include: {
        lead: {
          select: { id: true, contactName: true, city: true, notes: true, interests: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    let signalsCreated = 0;
    const findings: AgentFindingDraft[] = [];

    for (const conversation of conversations) {
      const text = conversation.messages
        .map((message) => message.content)
        .reverse()
        .join(' ');
      const keywords = this.collectKeywords([
        text,
        conversation.subject ?? '',
        conversation.lead?.notes ?? '',
        this.stringifyUnknownArray(conversation.lead?.interests).join(' '),
      ]);
      const urgency = this.inferUrgency(text, conversation.intent);
      const summary = this.buildSignalSummary(text, conversation.lead?.contactName);
      const valuePotential = this.estimateSignalValue(keywords);
      const signalSource = `conversation:${conversation.id}`;

      const signal = await this.prisma.socialSignal.upsert({
        where: { id: `${runId}-${conversation.id}` },
        update: {
          summary,
          location: conversation.lead?.city ?? null,
          keywords,
          urgency,
          valuePotential,
          status: 'OPEN',
          payload: {
            conversationId: conversation.id,
            leadId: conversation.lead?.id ?? null,
            messageCount: conversation.messages.length,
            sourceKey: signalSource,
          } as Prisma.InputJsonValue,
        },
        create: {
          id: `${runId}-${conversation.id}`,
          source: signalSource,
          channel: conversation.channel,
          summary,
          location: conversation.lead?.city ?? null,
          keywords,
          urgency,
          valuePotential,
          status: 'OPEN',
          payload: {
            conversationId: conversation.id,
            leadId: conversation.lead?.id ?? null,
            messageCount: conversation.messages.length,
            sourceKey: signalSource,
          } as Prisma.InputJsonValue,
        },
      });

      signalsCreated += 1;
      findings.push(
        buildAgentFindingDraft({
          type: 'social-signal',
          title: `Senal detectada en ${conversation.channel}`,
          description:
            `${summary} Urgencia ${urgency}. Potencial estimado L ${valuePotential.toFixed(2)}.`,
          priority: this.priorityFromUrgency(urgency),
          score: this.scoreFromUrgency(urgency),
          entityType: 'SocialSignal',
          entityId: signal.id,
          payload: {
            conversationId: conversation.id,
            leadId: conversation.lead?.id ?? null,
            keywords,
            urgency,
            valuePotential,
            promptKey: getDefaultPromptForAgent('escucha-social').key,
          },
        }),
      );
    }

    if (!findings.length) {
      findings.push(
        buildAgentFindingDraft({
          type: 'social-signal',
          title: 'Sin senales nuevas para clasificar',
          description: 'No se encontraron conversaciones recientes para convertir a social signals.',
          priority: 'LOW',
        }),
      );
    }

    await this.persistFindings(runId, findings);

    return {
      summary: 'Escucha social ejecutada sobre conversaciones y mensajes reales.',
      findingsCreated: findings.length,
      analyzedRecords: conversations.length,
      promptKey: getDefaultPromptForAgent('escucha-social').key,
      details: {
        signalsCreated,
      },
    };
  }

  private async runEjecutivoComercial(
    runId: string,
    input: Record<string, unknown>,
  ): Promise<AgentExecutionOutput> {
    const limit = this.normalizeLimit(input['limit']);
    const leads = await this.prisma.lead.findMany({
      where: {
        stage: {
          notIn: [LeadStage.CLOSED_WON, LeadStage.CLOSED_LOST],
        },
      },
      include: {
        company: {
          select: { name: true },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            totalOrders: true,
            lastOrderAt: true,
          },
        },
        conversations: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 2,
            },
          },
        },
      },
      orderBy: [{ score: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });

    const findings: AgentFindingDraft[] = [];

    for (const lead of leads) {
      const conversation = lead.conversations[0];
      const conversationText = conversation?.messages
        ?.map((message) => message.content)
        .reverse()
        .join(' ') ?? '';
      const keywords = this.collectKeywords([
        lead.notes ?? '',
        conversationText,
        this.stringifyUnknownArray(lead.interests).join(' '),
      ]);
      const suggestedOffer = await this.pickSuggestedOffer(keywords.join(' '));
      const draftMessage = this.buildCommercialDraft({
        contactName: lead.contactName,
        stage: lead.stage,
        companyName: lead.company?.name ?? null,
        conversationText,
        suggestedOffer: suggestedOffer.name,
        pricingModel: suggestedOffer.pricingModel,
      });

      findings.push(
        buildAgentFindingDraft({
          type: 'commercial-draft',
          title: `Borrador comercial para ${lead.contactName}`,
          description:
            `Seguimiento sugerido para lead ${lead.stage} con oferta ${suggestedOffer.name}.`,
          priority: this.priorityFromScore(lead.score),
          score: lead.score,
          entityType: 'Lead',
          entityId: lead.id,
          payload: {
            draftMessage,
            suggestedOfferId: suggestedOffer.id,
            suggestedOfferSlug: suggestedOffer.slug,
            suggestedOfferName: suggestedOffer.name,
            pricingModel: suggestedOffer.pricingModel,
            requiresHumanApproval: true,
            promptKey: getDefaultPromptForAgent('ejecutivo-comercial').key,
          },
        }),
      );
    }

    if (!findings.length) {
      findings.push(
        buildAgentFindingDraft({
          type: 'commercial-draft',
          title: 'No hay leads abiertos para redactar seguimiento',
          description: 'La corrida no encontro leads abiertos con contexto comercial suficiente.',
          priority: 'LOW',
        }),
      );
    }

    await this.persistFindings(runId, findings);

    return {
      summary: 'Ejecutivo comercial conectado a leads y conversaciones reales.',
      findingsCreated: findings.length,
      analyzedRecords: leads.length,
      promptKey: getDefaultPromptForAgent('ejecutivo-comercial').key,
      details: {
        draftsReadyForReview: findings.length,
      },
    };
  }

  private async runCommunityManager(
    runId: string,
    input: Record<string, unknown>,
  ): Promise<AgentExecutionOutput> {
    const limit = this.normalizeLimit(input['limit'], 6);
    const campaigns = await this.prisma.campaign.findMany({
      orderBy: [{ updatedAt: 'desc' }],
      select: {
        id: true,
        name: true,
        objective: true,
        channel: true,
        status: true,
      },
      take: limit,
    });

    const signals = await this.prisma.socialSignal.findMany({
      orderBy: [{ detectedAt: 'desc' }],
      take: limit,
    });

    const products = await this.prisma.product.findMany({
      where: { active: true },
      orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        pricingModel: true,
      },
      take: limit,
    });

    const recentCalendar = await this.prisma.contentCalendar.findMany({
      orderBy: [{ publishAt: 'desc' }],
      select: {
        topic: true,
      },
      take: 12,
    });

    const channels = this.pickCommunityChannels(campaigns);
    const draftCount = Math.max(1, Math.min(3, Math.max(products.length, signals.length, channels.length)));
    const findings: AgentFindingDraft[] = [];

    for (let index = 0; index < draftCount; index += 1) {
      const product = products[index % Math.max(1, products.length)] ?? null;
      const signal = signals[index % Math.max(1, signals.length)] ?? null;
      const channel = channels[index % channels.length];
      const campaign =
        campaigns.find((item) => item.channel === channel) ??
        campaigns[index % Math.max(1, campaigns.length)] ??
        null;
      const topic = this.buildCommunityTopic({
        channel,
        productName: product?.name ?? 'SubliGo',
        signalSummary: signal?.summary ?? null,
        existingTopics: recentCalendar.map((entry) => entry.topic),
      });
      const copy = this.buildCommunityDraft({
        channel,
        topic,
        productName: product?.name ?? 'SubliGo',
        productDescription: product?.description ?? '',
        signalSummary: signal?.summary ?? null,
        objective: campaign?.objective ?? 'activar demanda y mantener presencia de marca',
      });
      const contentEntry = await this.prisma.contentCalendar.create({
        data: {
          campaignId: campaign?.id ?? null,
          publishAt: this.suggestPublishAt(index),
          channel,
          status: CampaignStatus.DRAFT,
          topic,
          copy,
          notes:
            'Generado por Community Manager IA. Requiere aprobacion humana antes de publicar.',
        },
      });

      findings.push(
        buildAgentFindingDraft({
          type: 'content-draft',
          title: `Borrador ${this.humanizeCampaignChannel(channel)}: ${topic}`,
          description:
            `Draft editorial listo para revision humana con foco en ${product?.name ?? 'marca'} y contexto comercial reciente.`,
          priority: signal ? this.priorityFromUrgency(signal.urgency) : 'MEDIUM',
          score: signal ? this.scoreFromUrgency(signal.urgency) : 60,
          entityType: 'ContentCalendar',
          entityId: contentEntry.id,
          payload: {
            channel,
            topic,
            draftCopy: copy,
            contentEntryId: contentEntry.id,
            campaignId: campaign?.id ?? null,
            campaignName: campaign?.name ?? null,
            sourceSignalId: signal?.id ?? null,
            sourceSignalSummary: signal?.summary ?? null,
            suggestedProductId: product?.id ?? null,
            suggestedProductName: product?.name ?? null,
            promptKey: getDefaultPromptForAgent('community-manager').key,
            requiresHumanApproval: true,
          },
        }),
      );
    }

    await this.persistFindings(runId, findings);

    return {
      summary: 'Community Manager conectado a social signals, catalogo y calendario editorial.',
      findingsCreated: findings.length,
      analyzedRecords: campaigns.length + signals.length + products.length,
      promptKey: getDefaultPromptForAgent('community-manager').key,
      finalStatus: AgentRunStatus.REQUIRES_REVIEW,
      details: {
        campaignsAnalyzed: campaigns.length,
        signalsAnalyzed: signals.length,
        productsAnalyzed: products.length,
        draftsReadyForReview: findings.length,
      },
    };
  }

  private async runAnalistaCampanas(
    runId: string,
    input: Record<string, unknown>,
  ): Promise<AgentExecutionOutput> {
    const limit = this.normalizeLimit(input['limit'], 8);
    const campaigns = await this.prisma.campaign.findMany({
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        performances: {
          orderBy: [{ date: 'desc' }],
          take: 14,
        },
      },
      take: limit,
    });

    const findings: AgentFindingDraft[] = [];

    for (const campaign of campaigns) {
      const metrics = this.summarizeCampaignPerformance(campaign.performances);

      if (!campaign.performances.length) {
        findings.push(
          buildAgentFindingDraft({
            type: 'campaign-observation',
            title: `${campaign.name} aun no tiene historial para evaluar`,
            description:
              'La campana existe pero todavia no acumula suficientes snapshots de rendimiento para detectar oportunidades o riesgos.',
            priority: 'LOW',
            entityType: 'Campaign',
            entityId: campaign.id,
            payload: {
              campaignId: campaign.id,
              campaignName: campaign.name,
              channel: campaign.channel,
              promptKey: getDefaultPromptForAgent('analista-campanas').key,
              requiresHumanApproval: false,
            },
          }),
        );
        continue;
      }

      const recommendation = this.buildCampaignRecommendation({
        campaignName: campaign.name,
        channel: campaign.channel,
        metrics,
      });

      findings.push(
        buildAgentFindingDraft({
          type: recommendation.type,
          title: recommendation.title,
          description: recommendation.description,
          priority: recommendation.priority,
          score: recommendation.score,
          entityType: 'Campaign',
          entityId: campaign.id,
          payload: {
            campaignId: campaign.id,
            campaignName: campaign.name,
            channel: campaign.channel,
            status: campaign.status,
            promptKey: getDefaultPromptForAgent('analista-campanas').key,
            requiresHumanApproval: true,
            recommendation: recommendation.recommendation,
            metrics: {
              impressions: metrics.impressions,
              clicks: metrics.clicks,
              conversions: metrics.conversions,
              leads: metrics.leads,
              spend: Number(metrics.spend.toFixed(2)),
              revenue: Number(metrics.revenue.toFixed(2)),
              ctr: Number(metrics.ctr.toFixed(2)),
              conversionRate: Number(metrics.conversionRate.toFixed(2)),
              cpc: Number(metrics.cpc.toFixed(2)),
              roas: Number(metrics.roas.toFixed(2)),
            },
          },
        }),
      );
    }

    if (!findings.length) {
      findings.push(
        buildAgentFindingDraft({
          type: 'campaign-observation',
          title: 'No hay campanas disponibles para analizar',
          description:
            'La corrida no encontro campanas ni snapshots de rendimiento en la base actual.',
          priority: 'LOW',
        }),
      );
    }

    await this.persistFindings(runId, findings);

    const requiresReview = findings.some((finding) => finding.payload?.['requiresHumanApproval'] === true);

    return {
      summary: 'Analista de Campanas conectado a campanas y snapshots de ad performance.',
      findingsCreated: findings.length,
      analyzedRecords: campaigns.length,
      promptKey: getDefaultPromptForAgent('analista-campanas').key,
      finalStatus: requiresReview ? AgentRunStatus.REQUIRES_REVIEW : AgentRunStatus.COMPLETED,
      details: {
        campaignsAnalyzed: campaigns.length,
        findingsRequiringReview: findings.filter(
          (finding) => finding.payload?.['requiresHumanApproval'] === true,
        ).length,
      },
    };
  }

  private async runCoordinadorOperativo(
    runId: string,
    input: Record<string, unknown>,
  ): Promise<AgentExecutionOutput> {
    const limit = this.normalizeLimit(input['limit'], 8);
    const orders = await this.prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.PAID, OrderStatus.IN_PRODUCTION, OrderStatus.READY, OrderStatus.INCIDENT],
        },
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
            artwork: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
        tasks: {
          where: {
            status: {
              in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
            },
          },
          select: {
            id: true,
            title: true,
            priority: true,
            status: true,
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: limit,
    });

    const findings: AgentFindingDraft[] = [];

    for (const order of orders) {
      const customerName = [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') || 'Cliente sin nombre';
      const blockedTasks = order.tasks.filter((task) => task.status === TaskStatus.BLOCKED).length;
      const urgentTasks = order.tasks.filter(
        (task) => task.priority === TaskPriority.HIGH || task.priority === TaskPriority.CRITICAL,
      ).length;
      const missingArtworks = order.items.filter(
        (item) => !item.artwork || item.artwork.status !== ArtworkStatus.READY,
      ).length;

      if (order.status === OrderStatus.INCIDENT || blockedTasks > 0) {
        findings.push(
          buildAgentFindingDraft({
            type: 'production-risk',
            title: `${order.orderNumber} requiere atencion operativa inmediata`,
            description: `El pedido de ${customerName} tiene ${blockedTasks} tarea(s) bloqueada(s) y debe priorizarse hoy para proteger la entrega.`,
            priority: 'HIGH',
            score: 86,
            entityType: 'Order',
            entityId: order.id,
            payload: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              promptKey: getDefaultPromptForAgent('coordinador-operativo').key,
              requiresHumanApproval: true,
              recommendation:
                'Asignar responsable hoy, desbloquear la tarea critica y revalidar la fecha prometida antes de cerrar el turno.',
              taskSuggestion: {
                orderId: order.id,
                title: `Resolver bloqueo de ${order.orderNumber}`,
                description:
                  'Revision generada por Coordinador Operativo IA para remover bloqueos y proteger SLA.',
                priority: 'CRITICAL',
              },
            },
          }),
        );
        continue;
      }

      if (order.status === OrderStatus.IN_PRODUCTION && missingArtworks > 0) {
        findings.push(
          buildAgentFindingDraft({
            type: 'artwork-bottleneck',
            title: `${order.orderNumber} sigue en produccion sin arte final completo`,
            description: `Hay ${missingArtworks} item(s) sin arte listo en el pedido de ${customerName}. Conviene intervenir antes de que genere retraso.`,
            priority: 'HIGH',
            score: 79,
            entityType: 'Order',
            entityId: order.id,
            payload: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              promptKey: getDefaultPromptForAgent('coordinador-operativo').key,
              requiresHumanApproval: true,
              recommendation:
                'Forzar validacion de arte, confirmar insumo disponible y mover este pedido al primer bloque operativo del dia.',
              taskSuggestion: {
                orderId: order.id,
                title: `Validar arte y produccion de ${order.orderNumber}`,
                description:
                  'Asegurar que todos los items tengan arte final aprobado antes de continuar produccion.',
                priority: 'HIGH',
              },
            },
          }),
        );
        continue;
      }

      findings.push(
        buildAgentFindingDraft({
          type: 'production-observation',
          title: `${order.orderNumber} puede avanzar sin riesgo inmediato`,
          description: `Pedido de ${customerName} con ${urgentTasks} tarea(s) critica(s) abiertas y estado ${order.status}. Mantener monitoreo operativo.`,
          priority: urgentTasks > 0 ? 'MEDIUM' : 'LOW',
          score: urgentTasks > 0 ? 62 : 48,
          entityType: 'Order',
          entityId: order.id,
          payload: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            promptKey: getDefaultPromptForAgent('coordinador-operativo').key,
            requiresHumanApproval: false,
          },
        }),
      );
    }

    if (!findings.length) {
      findings.push(
        buildAgentFindingDraft({
          type: 'production-observation',
          title: 'No hay pedidos operativos para revisar',
          description: 'La corrida no encontro pedidos en produccion o listos para monitoreo.',
          priority: 'LOW',
        }),
      );
    }

    await this.persistFindings(runId, findings);

    const requiresReview = findings.some((finding) => finding.payload?.['requiresHumanApproval'] === true);

    return {
      summary: 'Coordinador Operativo conectado a pedidos, arte y tareas reales.',
      findingsCreated: findings.length,
      analyzedRecords: orders.length,
      promptKey: getDefaultPromptForAgent('coordinador-operativo').key,
      finalStatus: requiresReview ? AgentRunStatus.REQUIRES_REVIEW : AgentRunStatus.COMPLETED,
      details: {
        ordersAnalyzed: orders.length,
        findingsRequiringReview: findings.filter(
          (finding) => finding.payload?.['requiresHumanApproval'] === true,
        ).length,
      },
    };
  }

  private async runAnalistaFinanciero(
    runId: string,
    input: Record<string, unknown>,
  ): Promise<AgentExecutionOutput> {
    const limit = this.normalizeLimit(input['limit'], 12);
    const [orders, pricingRules] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          paymentStatus: PaymentStatus.PAID,
        },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              totalLifetimeValue: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  pricingModel: true,
                },
              },
            },
          },
          payments: {
            select: {
              amount: true,
              status: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        take: limit,
      }),
      this.prisma.productPricingRule.findMany({
        where: { active: true },
        orderBy: [{ createdAt: 'desc' }],
      }),
    ]);

    const findings: AgentFindingDraft[] = [];
    const paidOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + this.toNumber(order.total), 0);
    const averageTicket = paidOrders > 0 ? totalRevenue / paidOrders : 0;
    const lowMarginItems = [];

    for (const order of orders) {
      for (const item of order.items) {
        const activeRule = pricingRules.find((rule) => rule.productId === item.productId);
        if (!activeRule) continue;

        const estimatedCost =
          item.product.pricingModel === 'AREA'
            ? this.toNumber(activeRule.estimatedCostPerSquareMeter) * this.toNumber(item.areaSquareMeters)
            : this.toNumber(activeRule.estimatedUnitCost) * item.quantity;
        const revenue = this.toNumber(item.lineTotal);
        if (revenue <= 0) continue;

        const marginPct = revenue > 0 ? ((revenue - estimatedCost) / revenue) * 100 : 0;

        if (marginPct < 18) {
          lowMarginItems.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            productName: item.product.name,
            marginPct,
            revenue,
          });
        }
      }
    }

    if (lowMarginItems.length) {
      const worstItem = lowMarginItems.sort((a, b) => a.marginPct - b.marginPct)[0];
      findings.push(
        buildAgentFindingDraft({
          type: 'financial-margin-alert',
          title: `${worstItem.productName} muestra margen bajo en ${worstItem.orderNumber}`,
          description: `El margen estimado cae a ${worstItem.marginPct.toFixed(1)}% y conviene revisar precio, costo o mix comercial antes de repetir esta configuracion.`,
          priority: 'HIGH',
          score: 83,
          entityType: 'Order',
          entityId: worstItem.orderId,
          payload: {
            orderId: worstItem.orderId,
            orderNumber: worstItem.orderNumber,
            promptKey: getDefaultPromptForAgent('analista-financiero').key,
            requiresHumanApproval: true,
            recommendation:
              'Revisar costo base, personalizacion y precio de venta del producto antes de seguir promocionando este mix en nuevas cotizaciones.',
            taskSuggestion: {
              orderId: worstItem.orderId,
              title: `Revisar margen de ${worstItem.productName}`,
              description:
                'Analizar costo, setup y precio recomendado para evitar repetir pedidos con margen por debajo del umbral.',
              priority: 'HIGH',
            },
          },
        }),
      );
    }

    findings.push(
      buildAgentFindingDraft({
        type: 'financial-summary',
        title: `Ticket promedio actual: L ${averageTicket.toFixed(2)}`,
        description: `Se analizaron ${paidOrders} pedido(s) pagados con ingresos por L ${totalRevenue.toFixed(2)}.`,
        priority: averageTicket >= 3500 ? 'LOW' : 'MEDIUM',
        score: averageTicket >= 3500 ? 60 : 70,
        payload: {
          promptKey: getDefaultPromptForAgent('analista-financiero').key,
          requiresHumanApproval: false,
          averageTicket: Number(averageTicket.toFixed(2)),
          totalRevenue: Number(totalRevenue.toFixed(2)),
          paidOrders,
        },
      }),
    );

    const topCustomer = orders
      .map((order) => order.customer)
      .filter(Boolean)
      .sort((a, b) => this.toNumber(b?.totalLifetimeValue) - this.toNumber(a?.totalLifetimeValue))[0];

    if (topCustomer) {
      findings.push(
        buildAgentFindingDraft({
          type: 'financial-expansion-opportunity',
          title: `${topCustomer.firstName} ${topCustomer.lastName} merece foco de cuenta`,
          description: `Este cliente ya acumula L ${this.toNumber(topCustomer.totalLifetimeValue).toFixed(2)} en valor historico y conviene proteger su recurrencia.`,
          priority: 'MEDIUM',
          score: 72,
          payload: {
            promptKey: getDefaultPromptForAgent('analista-financiero').key,
            requiresHumanApproval: false,
          },
        }),
      );
    }

    await this.persistFindings(runId, findings);

    const requiresReview = findings.some((finding) => finding.payload?.['requiresHumanApproval'] === true);

    return {
      summary: 'Analista Financiero conectado a pedidos pagados, pricing rules y rentabilidad estimada.',
      findingsCreated: findings.length,
      analyzedRecords: orders.length,
      promptKey: getDefaultPromptForAgent('analista-financiero').key,
      finalStatus: requiresReview ? AgentRunStatus.REQUIRES_REVIEW : AgentRunStatus.COMPLETED,
      details: {
        paidOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        lowMarginAlerts: lowMarginItems.length,
      },
    };
  }

  private async persistFindings(runId: string, findings: AgentFindingDraft[]) {
    for (const finding of findings) {
      await this.prisma.agentFinding.create({
        data: {
          agentRunId: runId,
          type: finding.type,
          title: finding.title,
          description: finding.description,
          priority: finding.priority,
          score: finding.score ?? null,
          entityType: finding.entityType ?? null,
          entityId: finding.entityId ?? null,
          payload: (finding.payload ?? {}) as Prisma.InputJsonValue,
        },
      });
    }
  }

  private normalizeAgentId(agentId?: string): AgentId | undefined {
    if (!agentId) return undefined;

    const normalized = agentId.trim().toLowerCase();
    const aliases: Record<string, AgentId> = {
      'prospectador local': 'prospectador-local',
      'prospectador-local': 'prospectador-local',
      'escucha social': 'escucha-social',
      'escucha-social': 'escucha-social',
      'ejecutivo comercial': 'ejecutivo-comercial',
      'ejecutivo-comercial': 'ejecutivo-comercial',
      'community manager': 'community-manager',
      'community-manager': 'community-manager',
      'analista campanas': 'analista-campanas',
      'analista-campanas': 'analista-campanas',
      'analista de campanas': 'analista-campanas',
      'analista-de-campanas': 'analista-campanas',
      'coordinador operativo': 'coordinador-operativo',
      'coordinador-operativo': 'coordinador-operativo',
      'analista financiero': 'analista-financiero',
      'analista-financiero': 'analista-financiero',
    };

    const resolved = aliases[normalized] ?? (normalized as AgentId);
    return AI_AGENT_IDS.includes(resolved) ? resolved : undefined;
  }

  private ensureAgentId(agentId: string): AgentId {
    const normalizedAgentId = this.normalizeAgentId(agentId);
    if (!normalizedAgentId) {
      throw new BadRequestException(`Agente ${agentId} no soportado`);
    }
    return normalizedAgentId;
  }

  private normalizeMode(mode?: string): PrismaAgentMode | undefined {
    if (!mode) return undefined;
    return (Object.values(PrismaAgentMode) as string[]).includes(mode)
      ? (mode as PrismaAgentMode)
      : undefined;
  }

  private normalizeLimit(value: unknown, max = 10) {
    const parsed = Number(value ?? 5);
    if (!Number.isFinite(parsed)) return 5;
    return Math.max(1, Math.min(max, Math.round(parsed)));
  }

  private stringifyUnknownArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.map((item) => String(item));
  }

  private collectKeywords(chunks: string[]) {
    const text = chunks.join(' ').toLowerCase();
    const dictionary = [
      'banner',
      'lona',
      'vinil',
      'taza',
      'camiseta',
      'camisa',
      'tumbler',
      'botella',
      'evento',
      'promocion',
      'rotulo',
      'branding',
      'apertura',
      'urgente',
      'cotizacion',
    ];

    return dictionary.filter((keyword) => text.includes(keyword));
  }

  private async pickSuggestedOffer(text: string) {
    const featuredProducts = await this.prisma.product.findMany({
      where: { active: true, featured: true },
      select: { id: true, name: true, slug: true, pricingModel: true },
      orderBy: { createdAt: 'asc' },
      take: 5,
    });

    const lowerText = text.toLowerCase();
    const matched =
      featuredProducts.find((product) =>
        lowerText.includes(product.name.toLowerCase().split(' ')[0] ?? ''),
      ) ??
      featuredProducts.find((product) =>
        product.pricingModel === 'AREA'
          ? /banner|lona|vinil|rotulo/.test(lowerText)
          : /taza|camisa|camiseta|tumbler|botella/.test(lowerText),
      ) ??
      featuredProducts[0];

    if (!matched) {
      throw new NotFoundException('No hay productos destacados disponibles para el motor comercial');
    }

    return matched;
  }

  private priorityFromScore(score: number): AgentFindingDraft['priority'] {
    if (score >= 85) return 'CRITICAL';
    if (score >= 70) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    return 'LOW';
  }

  private inferUrgency(text: string, intent?: ConversationIntent | null) {
    const lowerText = text.toLowerCase();
    if (intent === ConversationIntent.URGENT || /urgente|hoy|ya|asap|inmediato/.test(lowerText)) {
      return 'URGENT' as const;
    }
    if (intent === ConversationIntent.QUOTE || /cotizacion|precio|cuanto|necesito/.test(lowerText)) {
      return 'HIGH' as const;
    }
    if (/evento|apertura|promocion|campana/.test(lowerText)) {
      return 'MEDIUM' as const;
    }
    return 'LOW' as const;
  }

  private priorityFromUrgency(urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'): AgentFindingDraft['priority'] {
    if (urgency === 'URGENT') return 'CRITICAL';
    if (urgency === 'HIGH') return 'HIGH';
    if (urgency === 'MEDIUM') return 'MEDIUM';
    return 'LOW';
  }

  private scoreFromUrgency(urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') {
    if (urgency === 'URGENT') return 90;
    if (urgency === 'HIGH') return 75;
    if (urgency === 'MEDIUM') return 55;
    return 30;
  }

  private estimateSignalValue(keywords: string[]) {
    const keywordValueMap: Record<string, number> = {
      banner: 1800,
      lona: 1800,
      vinil: 2200,
      rotulo: 2600,
      taza: 950,
      camiseta: 2400,
      camisa: 2400,
      tumbler: 1800,
      botella: 1800,
      branding: 3200,
      promocion: 1400,
    };

    return keywords.reduce((sum, keyword) => sum + (keywordValueMap[keyword] ?? 450), 0) || 450;
  }

  private buildSignalSummary(text: string, contactName?: string | null) {
    const compact = text.replace(/\s+/g, ' ').trim();
    const prefix = contactName ? `${contactName}: ` : '';
    return `${prefix}${compact.slice(0, 120)}`.trim();
  }

  private buildCommercialDraft(params: {
    contactName: string;
    stage: LeadStage;
    companyName?: string | null;
    conversationText: string;
    suggestedOffer: string;
    pricingModel: 'UNIT' | 'AREA';
  }) {
    const firstName = params.contactName.split(' ')[0] ?? params.contactName;
    const requirement =
      params.pricingModel === 'AREA'
        ? 'ancho y alto finales'
        : 'cantidad, variante y fecha estimada';
    const followUp =
      params.stage === LeadStage.QUOTED
        ? 'Ya tengo contexto para cerrar la propuesta contigo.'
        : 'Puedo prepararte una propuesta concreta hoy mismo.';
    const contextLine = params.conversationText
      ? `Tomo en cuenta tu mensaje sobre "${params.conversationText.slice(0, 90)}".`
      : '';

    return [
      `Hola ${firstName}, soy el asistente comercial de SubliGo.`,
      contextLine,
      `${followUp} Te recomiendo ${params.suggestedOffer}${params.companyName ? ` para ${params.companyName}` : ''}.`,
      `Si me confirmas ${requirement}, te dejo el siguiente paso listo para revision humana.`,
    ]
      .filter(Boolean)
      .join(' ');
  }

  private pickCommunityChannels(
    campaigns: Array<{ channel: CampaignChannel }>,
  ): CampaignChannel[] {
    const campaignChannels = campaigns.map((campaign) => campaign.channel);
    const uniqueCampaignChannels = Array.from(new Set(campaignChannels));
    const supportedChannels = uniqueCampaignChannels.filter(
      (channel): channel is (typeof COMMUNITY_MANAGER_CHANNELS)[number] =>
        COMMUNITY_MANAGER_CHANNELS.includes(channel as (typeof COMMUNITY_MANAGER_CHANNELS)[number]),
    );

    return supportedChannels.length ? supportedChannels : [...COMMUNITY_MANAGER_CHANNELS];
  }

  private buildCommunityTopic(params: {
    channel: CampaignChannel;
    productName: string;
    signalSummary?: string | null;
    existingTopics: string[];
  }) {
    const signalHook = params.signalSummary
      ? params.signalSummary.replace(/\s+/g, ' ').trim().slice(0, 48)
      : 'demanda activa';
    const base = `${params.productName} en ${this.humanizeCampaignChannel(params.channel)} para ${signalHook}`;
    const topic = base.trim();
    const isDuplicate = params.existingTopics.some(
      (existingTopic) => existingTopic.toLowerCase() === topic.toLowerCase(),
    );

    return isDuplicate ? `${topic} (${new Date().toLocaleDateString('es-HN')})` : topic;
  }

  private buildCommunityDraft(params: {
    channel: CampaignChannel;
    topic: string;
    productName: string;
    productDescription: string;
    signalSummary?: string | null;
    objective: string;
  }) {
    const hook = params.signalSummary
      ? `Detectamos interes reciente: ${params.signalSummary.slice(0, 110)}.`
      : `Estamos reforzando la presencia de ${params.productName} en canales clave.`;
    const valueLine = params.productDescription
      ? params.productDescription.slice(0, 120)
      : `${params.productName} disponible para pedidos y cotizaciones guiadas.`;

    switch (params.channel) {
      case CampaignChannel.WHATSAPP:
        return [
          `Tema: ${params.topic}.`,
          hook,
          `Objetivo: ${params.objective}.`,
          `Mensaje sugerido: ${valueLine}. Escribenos por WhatsApp y te guiamos con cantidades, medidas o variantes.`,
          'Requiere aprobacion humana antes de publicarse.',
        ].join(' ');
      case CampaignChannel.FACEBOOK:
        return [
          `Tema: ${params.topic}.`,
          hook,
          `En SubliGo convertimos ideas en produccion real. ${valueLine}.`,
          'Cierre sugerido: solicita una cotizacion y recibe una propuesta a tu medida.',
          'Requiere aprobacion humana antes de publicarse.',
        ].join(' ');
      case CampaignChannel.INSTAGRAM:
      default:
        return [
          `Tema: ${params.topic}.`,
          hook,
          `${params.productName}: ${valueLine}.`,
          'CTA sugerido: escribenos para cotizar hoy mismo.',
          'Requiere aprobacion humana antes de publicarse.',
        ].join(' ');
    }
  }

  private suggestPublishAt(index: number) {
    const publishAt = new Date();
    publishAt.setDate(publishAt.getDate() + 1 + index);
    publishAt.setHours(10 + index * 2, 0, 0, 0);
    return publishAt;
  }

  private summarizeCampaignPerformance(
    performances: Array<{
      impressions: number;
      clicks: number;
      conversions: number;
      leads: number;
      spend: Prisma.Decimal | number;
      revenue: Prisma.Decimal | number;
    }>,
  ) {
    const impressions = performances.reduce((sum, item) => sum + item.impressions, 0);
    const clicks = performances.reduce((sum, item) => sum + item.clicks, 0);
    const conversions = performances.reduce((sum, item) => sum + item.conversions, 0);
    const leads = performances.reduce((sum, item) => sum + item.leads, 0);
    const spend = performances.reduce((sum, item) => sum + this.toNumber(item.spend), 0);
    const revenue = performances.reduce((sum, item) => sum + this.toNumber(item.revenue), 0);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : spend;
    const roas = spend > 0 ? revenue / spend : 0;

    return {
      impressions,
      clicks,
      conversions,
      leads,
      spend,
      revenue,
      ctr,
      conversionRate,
      cpc,
      roas,
    };
  }

  private buildCampaignRecommendation(params: {
    campaignName: string;
    channel: CampaignChannel;
    metrics: {
      impressions: number;
      clicks: number;
      conversions: number;
      leads: number;
      spend: number;
      revenue: number;
      ctr: number;
      conversionRate: number;
      cpc: number;
      roas: number;
    };
  }) {
    const channelLabel = this.humanizeCampaignChannel(params.channel);
    const metricsLine = `CTR ${params.metrics.ctr.toFixed(2)}%, conversion ${params.metrics.conversionRate.toFixed(2)}%, ROAS ${params.metrics.roas.toFixed(2)}x.`;

    if (params.metrics.spend >= 1200 && params.metrics.conversions === 0) {
      return {
        type: 'campaign-optimization',
        title: `${params.campaignName} esta gastando sin convertir`,
        description: `${metricsLine} La campana en ${channelLabel} necesita ajuste urgente de creativo, segmentacion o oferta.`,
        priority: 'HIGH' as const,
        score: 84,
        recommendation:
          'Pausar temporalmente el anuncio con peor respuesta, revisar mensaje principal y lanzar una variante creativa con CTA mas directo antes de seguir invirtiendo.',
      };
    }

    if (params.metrics.roas >= 3 && params.metrics.conversions >= 2) {
      return {
        type: 'campaign-scale-opportunity',
        title: `${params.campaignName} puede escalar presupuesto con control`,
        description: `${metricsLine} La campana en ${channelLabel} ya valida demanda y puede recibir un incremento gradual.`,
        priority: 'MEDIUM' as const,
        score: 76,
        recommendation:
          'Aumentar presupuesto en un rango controlado de 10% a 15% y duplicar el creativo con mejor respuesta manteniendo el mismo publico ganador.',
      };
    }

    if (params.metrics.impressions >= 2500 && params.metrics.ctr < 0.9) {
      return {
        type: 'campaign-creative-fatigue',
        title: `${params.campaignName} muestra desgaste creativo`,
        description: `${metricsLine} La campana ya tuvo alcance suficiente y el CTR de ${params.metrics.ctr.toFixed(2)}% sugiere fatiga del anuncio.`,
        priority: 'MEDIUM' as const,
        score: 68,
        recommendation:
          'Probar una nueva pieza visual, cambiar el gancho del primer segundo y ajustar el copy hacia una promesa mas concreta de producto o promocion.',
      };
    }

    return {
      type: 'campaign-observation',
      title: `${params.campaignName} requiere seguimiento de desempeno`,
      description: `${metricsLine} La campana en ${channelLabel} tiene senales mixtas y conviene monitorearla antes de mover presupuesto.`,
      priority: 'LOW' as const,
      score: 58,
      recommendation:
        'Mantener la campana activa y revisar su evolucion con el siguiente lote de datos antes de decidir pausas o incrementos.',
    };
  }

  private humanizeCampaignChannel(channel: CampaignChannel) {
    return channel.toLowerCase();
  }

  private requiresHumanReview(payload: unknown) {
    const record = this.asRecord(payload);
    if (!record || record['requiresHumanApproval'] !== true) {
      return false;
    }

    const review = this.asRecord(record['review']);
    const status = typeof review?.['status'] === 'string' ? review['status'] : 'PENDING';
    return status !== 'APPROVED' && status !== 'REJECTED';
  }

  private async syncReviewSideEffects(
    payload: unknown,
    decision: ReviewDecision,
    note?: string,
  ) {
    const record = this.asRecord(payload);
    const contentEntryId =
      record && typeof record['contentEntryId'] === 'string' ? record['contentEntryId'] : null;
    const taskSuggestion = record ? this.extractTaskSuggestion(record) : null;
    const taskOrderId =
      taskSuggestion?.orderId ??
      (record && typeof record['orderId'] === 'string' ? record['orderId'] : null);
    const taskLeadId =
      taskSuggestion?.leadId ??
      (record && typeof record['leadId'] === 'string' ? record['leadId'] : null);

    if (contentEntryId) {
      const contentEntry = await this.prisma.contentCalendar.findUnique({
        where: { id: contentEntryId },
        select: { id: true, notes: true },
      });

      if (contentEntry) {
        const reviewLine = `[${decision}] ${note?.trim() || 'Revision humana registrada.'}`;
        const nextNotes = [contentEntry.notes, reviewLine].filter(Boolean).join('\n');

        await this.prisma.contentCalendar.update({
          where: { id: contentEntryId },
          data: {
            status: decision === 'APPROVED' ? CampaignStatus.APPROVED : CampaignStatus.DRAFT,
            notes: nextNotes,
          },
        });
      }
    }

    if (decision !== 'APPROVED') {
      return;
    }

    if (taskSuggestion) {
      await this.prisma.task.create({
        data: {
          orderId: taskOrderId,
          leadId: taskLeadId,
          title: taskSuggestion.title,
          description: [taskSuggestion.description, note?.trim()].filter(Boolean).join('\n\n') || null,
          status: TaskStatus.TODO,
          priority: taskSuggestion.priority,
          metadata: {
            source: 'agent-review',
            agentGenerated: true,
            ...taskSuggestion.metadata,
          } as Prisma.InputJsonValue,
        },
      });
      return;
    }

    const campaignId =
      record && typeof record['campaignId'] === 'string' ? record['campaignId'] : null;
    const campaignName =
      record && typeof record['campaignName'] === 'string' ? record['campaignName'] : null;
    const recommendation =
      record && typeof record['recommendation'] === 'string' ? record['recommendation'] : null;

    if (campaignId && recommendation) {
      await this.prisma.task.create({
        data: {
          title: `Aplicar revision de campana: ${campaignName ?? campaignId}`,
          description: [recommendation, note?.trim()].filter(Boolean).join('\n\n'),
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH,
          metadata: {
            source: 'agent-review',
            campaignId,
            campaignName,
            recommendation,
          } as Prisma.InputJsonValue,
        },
      });
    }
  }

  private async syncRunReviewState(runId: string, reviewerId?: string) {
    const findings = await this.prisma.agentFinding.findMany({
      where: { agentRunId: runId },
      select: { payload: true },
    });

    const stillPendingReview = findings.some((finding) => this.requiresHumanReview(finding.payload));

    await this.prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: stillPendingReview ? AgentRunStatus.REQUIRES_REVIEW : AgentRunStatus.COMPLETED,
        reviewerId: reviewerId ?? null,
      },
    });
  }

  private asRecord(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    return value as Record<string, unknown>;
  }

  private extractTaskSuggestion(record: Record<string, unknown>) {
    const taskSuggestion = this.asRecord(record['taskSuggestion']);
    if (!taskSuggestion) {
      return null;
    }

    const title = typeof taskSuggestion['title'] === 'string' ? taskSuggestion['title'].trim() : '';
    if (!title) {
      return null;
    }

    const description =
      typeof taskSuggestion['description'] === 'string'
        ? taskSuggestion['description'].trim()
        : null;
    const orderId =
      typeof taskSuggestion['orderId'] === 'string' ? taskSuggestion['orderId'] : null;
    const leadId = typeof taskSuggestion['leadId'] === 'string' ? taskSuggestion['leadId'] : null;
    const priority = this.normalizeTaskPriority(taskSuggestion['priority']);

    return {
      title,
      description,
      orderId,
      leadId,
      priority,
      metadata: {
        orderId,
        leadId,
      },
    };
  }

  private normalizeTaskPriority(value: unknown) {
    if (typeof value !== 'string') {
      return TaskPriority.MEDIUM;
    }

    return (Object.values(TaskPriority) as string[]).includes(value)
      ? (value as TaskPriority)
      : TaskPriority.MEDIUM;
  }

  private toNumber(value: Prisma.Decimal | number | string | null | undefined) {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value) || 0;
    return Number(value.toString()) || 0;
  }
}
