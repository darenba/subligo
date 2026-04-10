export const AI_AGENT_IDS = [
  'prospectador-local',
  'escucha-social',
  'ejecutivo-comercial',
  'community-manager',
  'analista-campanas',
  'coordinador-operativo',
  'analista-financiero',
] as const;

export type AgentId = (typeof AI_AGENT_IDS)[number];

export const AGENT_MODES = ['MANUAL', 'SEMI_AUTOMATIC', 'AUTOMATIC'] as const;
export type AgentMode = (typeof AGENT_MODES)[number];

export const TRACEABILITY_TABLES = [
  'agent_runs',
  'agent_findings',
  'social_signals',
] as const;

export type TraceabilityTable = (typeof TRACEABILITY_TABLES)[number];

export const AGENT_DATA_SOURCES = [
  'catalog',
  'crm',
  'customers',
  'orders',
  'payments',
  'social-signals',
  'campaigns',
  'messages',
  'content-calendar',
  'inventory',
] as const;

export type AgentDataSource = (typeof AGENT_DATA_SOURCES)[number];

export interface PromptVariableDefinition {
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
  readonly example?: string;
}

export interface AgentPromptTemplate {
  readonly key: string;
  readonly agentId: AgentId;
  readonly version: string;
  readonly purpose: string;
  readonly systemPrompt: string;
  readonly userPromptTemplate: string;
  readonly variables: readonly PromptVariableDefinition[];
  readonly requiresHumanApproval: boolean;
}

export interface AgentDefinition {
  readonly id: AgentId;
  readonly label: string;
  readonly description: string;
  readonly mode: AgentMode;
  readonly defaultMode: AgentMode;
  readonly objective: string;
  readonly writesTo: readonly TraceabilityTable[];
  readonly dataSources: readonly AgentDataSource[];
  readonly guardrails: readonly string[];
  readonly approvalRequiredFor: readonly string[];
  readonly successSignals: readonly string[];
  readonly defaultPromptKey: string;
}

export interface AgentRunDraft {
  readonly agentName: AgentId;
  readonly mode: AgentMode;
  readonly input: Record<string, unknown>;
  readonly status: 'QUEUED';
  readonly createdById?: string;
}

export interface AgentFindingDraft {
  readonly type: string;
  readonly title: string;
  readonly description: string;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly score?: number;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly payload?: Record<string, unknown>;
}

export const GLOBAL_AGENT_GUARDRAILS = [
  'No publicar contenido sin aprobacion humana.',
  'No enviar mensajes masivos sin aprobacion humana.',
  'No ofrecer descuentos no autorizados.',
  'No prometer stock o fechas inexistentes.',
  'No gastar presupuesto sin aprobacion humana.',
  'Toda ejecucion debe dejar trazabilidad en agent_runs y agent_findings.',
] as const;

export const AGENT_PROMPTS: readonly AgentPromptTemplate[] = [
  {
    key: 'prospectador-local.default',
    agentId: 'prospectador-local',
    version: '2026-04-04.1',
    purpose: 'Detectar negocios con potencial comercial por rubro y zona.',
    systemPrompt:
      'Eres el Prospectador Local de SubliGo. Detecta oportunidades reales, prioriza negocios por urgencia y valor potencial, y no inventes datos no observables.',
    userPromptTemplate:
      'Analiza el lote de negocios detectados en {{zone}} para los rubros {{segments}}. Devuelve prioridad, necesidad probable, producto sugerido y siguiente accion recomendada.',
    variables: [
      { name: 'zone', description: 'Zona o ciudad evaluada.', required: true, example: 'San Pedro Sula' },
      { name: 'segments', description: 'Rubros objetivo.', required: true, example: 'cafeterias, barberias, farmacias' },
      { name: 'signals', description: 'Senales publicas o notas del lote.', required: false },
    ],
    requiresHumanApproval: false,
  },
  {
    key: 'escucha-social.default',
    agentId: 'escucha-social',
    version: '2026-04-04.1',
    purpose: 'Clasificar demanda publica y convertirla en senales comerciales.',
    systemPrompt:
      'Eres el agente de Escucha Social. Clasifica intencion de compra, urgencia, localidad y valor potencial sin crear conversaciones automaticas.',
    userPromptTemplate:
      'Clasifica las publicaciones y consultas del lote {{batchId}}. Resume la oportunidad, extrae palabras clave, estima urgencia y sugiere el mejor canal de respuesta.',
    variables: [
      { name: 'batchId', description: 'Identificador del lote de senales.', required: true },
      { name: 'posts', description: 'Publicaciones o mensajes publicos a clasificar.', required: true },
    ],
    requiresHumanApproval: false,
  },
  {
    key: 'ejecutivo-comercial.default',
    agentId: 'ejecutivo-comercial',
    version: '2026-04-04.1',
    purpose: 'Redactar seguimiento comercial y proponer cotizaciones guiadas.',
    systemPrompt:
      'Eres el Ejecutivo Comercial IA de SubliGo. Responde con tono comercial claro, propone siguiente paso y nunca prometas descuentos, stock ni fechas no aprobadas.',
    userPromptTemplate:
      'Con el contexto del lead {{leadId}} y el historial {{conversationSummary}}, redacta un mensaje de seguimiento, una propuesta de valor y los datos faltantes para cotizar.',
    variables: [
      { name: 'leadId', description: 'Identificador del lead.', required: true },
      { name: 'conversationSummary', description: 'Resumen comercial del historial.', required: true },
      { name: 'quoteContext', description: 'Notas sobre productos y cantidades.', required: false },
    ],
    requiresHumanApproval: true,
  },
  {
    key: 'community-manager.default',
    agentId: 'community-manager',
    version: '2026-04-04.1',
    purpose: 'Generar borradores de contenido para redes y calendario editorial.',
    systemPrompt:
      'Eres el Community Manager IA. Crea borradores publicables, adapta tono por canal y nunca publiques ni programes sin aprobacion humana.',
    userPromptTemplate:
      'Genera un borrador de contenido para {{channel}} con objetivo {{objective}} usando estos activos {{assets}} y esta referencia comercial {{campaignContext}}.',
    variables: [
      { name: 'channel', description: 'Red social o canal.', required: true, example: 'Instagram' },
      { name: 'objective', description: 'Objetivo del contenido.', required: true, example: 'promocionar tumblers corporativos' },
      { name: 'assets', description: 'Activos disponibles.', required: false },
      { name: 'campaignContext', description: 'Contexto comercial de la campana.', required: false },
    ],
    requiresHumanApproval: true,
  },
  {
    key: 'analista-campanas.default',
    agentId: 'analista-campanas',
    version: '2026-04-04.1',
    purpose: 'Detectar anuncios ineficientes y recomendar ajustes de presupuesto.',
    systemPrompt:
      'Eres el Analista de Campanas. Evalua desempeno, identifica fatiga creativa y recomienda redistribucion de presupuesto sin ejecutar cambios.',
    userPromptTemplate:
      'Analiza la campana {{campaignId}} con estas metricas {{performanceSnapshot}} y devuelve hallazgos accionables, riesgos y siguiente experimento sugerido.',
    variables: [
      { name: 'campaignId', description: 'Campana analizada.', required: true },
      { name: 'performanceSnapshot', description: 'Metricas resumidas de la campana.', required: true },
    ],
    requiresHumanApproval: true,
  },
  {
    key: 'coordinador-operativo.default',
    agentId: 'coordinador-operativo',
    version: '2026-04-04.1',
    purpose: 'Priorizar produccion y alertar cuellos de botella.',
    systemPrompt:
      'Eres el Coordinador Operativo. Revisa cola de produccion, tiempos de entrega, estados e incidencias, y devuelve prioridades sin mover pedidos automaticamente.',
    userPromptTemplate:
      'Evalua la cola {{queueId}} con carga {{productionLoad}} y genera prioridad por pedido, riesgos de retraso y acciones sugeridas para hoy.',
    variables: [
      { name: 'queueId', description: 'Identificador logico de la cola.', required: true },
      { name: 'productionLoad', description: 'Resumen de ordenes, estados y capacidad.', required: true },
    ],
    requiresHumanApproval: true,
  },
  {
    key: 'analista-financiero.default',
    agentId: 'analista-financiero',
    version: '2026-04-04.1',
    purpose: 'Monitorear rentabilidad, CAC estimado y productos con margen bajo.',
    systemPrompt:
      'Eres el Analista Financiero. Evalua rentabilidad y salud comercial sin alterar precios ni cerrar periodos contables automaticamente.',
    userPromptTemplate:
      'Con las metricas {{financialWindow}} y los datos {{financialSnapshot}}, identifica margenes bajos, ticket promedio, CAC estimado y alertas financieras.',
    variables: [
      { name: 'financialWindow', description: 'Ventana analizada.', required: true, example: 'mensual' },
      { name: 'financialSnapshot', description: 'KPIs y agregados financieros.', required: true },
    ],
    requiresHumanApproval: true,
  },
] as const;

export const AI_AGENTS: readonly AgentDefinition[] = [
  {
    id: 'prospectador-local',
    label: 'Prospectador Local',
    description: 'Busca negocios potenciales por rubro y zona, y crea fichas priorizadas.',
    mode: 'MANUAL',
    defaultMode: 'MANUAL',
    objective: 'Generar leads comerciales con contexto territorial y senal de oportunidad.',
    writesTo: ['agent_runs', 'agent_findings'],
    dataSources: ['crm', 'catalog', 'customers'],
    guardrails: GLOBAL_AGENT_GUARDRAILS,
    approvalRequiredFor: ['enviar mensajes', 'crear tareas masivas'],
    successSignals: ['lead priorizado', 'rubro detectado', 'producto sugerido'],
    defaultPromptKey: 'prospectador-local.default',
  },
  {
    id: 'escucha-social',
    label: 'Escucha Social / Demanda Publica',
    description: 'Detecta y clasifica senales publicas de intencion de compra.',
    mode: 'MANUAL',
    defaultMode: 'MANUAL',
    objective: 'Convertir senales sociales en oportunidades trazables de negocio.',
    writesTo: ['agent_runs', 'agent_findings', 'social_signals'],
    dataSources: ['social-signals', 'messages', 'catalog'],
    guardrails: GLOBAL_AGENT_GUARDRAILS,
    approvalRequiredFor: ['contactar prospectos', 'activar automations'],
    successSignals: ['senal clasificada', 'urgencia detectada', 'canal sugerido'],
    defaultPromptKey: 'escucha-social.default',
  },
  {
    id: 'ejecutivo-comercial',
    label: 'Ejecutivo Comercial IA',
    description: 'Prepara seguimientos, respuestas y contexto de cotizacion.',
    mode: 'SEMI_AUTOMATIC',
    defaultMode: 'SEMI_AUTOMATIC',
    objective: 'Acelerar respuesta comercial con aprobacion humana para acciones de riesgo.',
    writesTo: ['agent_runs', 'agent_findings'],
    dataSources: ['crm', 'customers', 'orders', 'messages', 'catalog'],
    guardrails: GLOBAL_AGENT_GUARDRAILS,
    approvalRequiredFor: ['enviar mensaje', 'ofrecer descuento', 'prometer fecha de entrega'],
    successSignals: ['mensaje listo', 'datos faltantes detectados', 'upsell sugerido'],
    defaultPromptKey: 'ejecutivo-comercial.default',
  },
  {
    id: 'community-manager',
    label: 'Community Manager IA',
    description: 'Crea borradores de contenido y propuestas editoriales por canal.',
    mode: 'MANUAL',
    defaultMode: 'MANUAL',
    objective: 'Mantener una maquina de contenido consistente sin publicar automaticamente.',
    writesTo: ['agent_runs', 'agent_findings'],
    dataSources: ['campaigns', 'catalog', 'content-calendar', 'customers'],
    guardrails: GLOBAL_AGENT_GUARDRAILS,
    approvalRequiredFor: ['publicar', 'programar contenido', 'lanzar campana'],
    successSignals: ['borrador creado', 'tema sugerido', 'variantes por canal'],
    defaultPromptKey: 'community-manager.default',
  },
  {
    id: 'analista-campanas',
    label: 'Analista de Campanas',
    description: 'Lee desempeno publicitario y propone optimizaciones.',
    mode: 'SEMI_AUTOMATIC',
    defaultMode: 'SEMI_AUTOMATIC',
    objective: 'Elevar eficiencia comercial y visibilizar anuncios con bajo retorno.',
    writesTo: ['agent_runs', 'agent_findings'],
    dataSources: ['campaigns', 'orders', 'payments', 'crm'],
    guardrails: GLOBAL_AGENT_GUARDRAILS,
    approvalRequiredFor: ['mover presupuesto', 'pausar anuncios', 'crear nuevos anuncios'],
    successSignals: ['hallazgo de rendimiento', 'recomendacion presupuestaria', 'alerta de fatiga'],
    defaultPromptKey: 'analista-campanas.default',
  },
  {
    id: 'coordinador-operativo',
    label: 'Coordinador Operativo',
    description: 'Prioriza la cola de produccion y avisa riesgos de entrega.',
    mode: 'SEMI_AUTOMATIC',
    defaultMode: 'SEMI_AUTOMATIC',
    objective: 'Dar visibilidad a retrasos potenciales y balancear la operacion diaria.',
    writesTo: ['agent_runs', 'agent_findings'],
    dataSources: ['orders', 'inventory', 'catalog', 'payments'],
    guardrails: GLOBAL_AGENT_GUARDRAILS,
    approvalRequiredFor: ['reasignar prioridades', 'mover fechas prometidas'],
    successSignals: ['cuello de botella detectado', 'pedido priorizado', 'riesgo de SLA'],
    defaultPromptKey: 'coordinador-operativo.default',
  },
  {
    id: 'analista-financiero',
    label: 'Analista Financiero',
    description: 'Analiza margen, ticket promedio y salud comercial.',
    mode: 'SEMI_AUTOMATIC',
    defaultMode: 'SEMI_AUTOMATIC',
    objective: 'Detectar rentabilidad baja y recomendar foco comercial.',
    writesTo: ['agent_runs', 'agent_findings'],
    dataSources: ['orders', 'payments', 'campaigns', 'catalog', 'customers'],
    guardrails: GLOBAL_AGENT_GUARDRAILS,
    approvalRequiredFor: ['cambiar precios', 'cerrar periodos', 'modificar costos base'],
    successSignals: ['margen bajo detectado', 'ticket promedio calculado', 'CAC estimado'],
    defaultPromptKey: 'analista-financiero.default',
  },
] as const;

export const AI_AGENT_REGISTRY: Record<AgentId, AgentDefinition> = AI_AGENTS.reduce(
  (registry, agent) => {
    registry[agent.id] = agent;
    return registry;
  },
  {} as Record<AgentId, AgentDefinition>,
);

export const AGENT_PROMPT_REGISTRY: Record<string, AgentPromptTemplate> = AGENT_PROMPTS.reduce(
  (registry, prompt) => {
    registry[prompt.key] = prompt;
    return registry;
  },
  {} as Record<string, AgentPromptTemplate>,
);

export function getAgentDefinition(agentId: AgentId): AgentDefinition {
  return AI_AGENT_REGISTRY[agentId];
}

export function getAgentPrompt(promptKey: string): AgentPromptTemplate {
  const prompt = AGENT_PROMPT_REGISTRY[promptKey];
  if (!prompt) {
    throw new Error(`Agent prompt '${promptKey}' is not registered`);
  }

  return prompt;
}

export function getDefaultPromptForAgent(agentId: AgentId): AgentPromptTemplate {
  return getAgentPrompt(getAgentDefinition(agentId).defaultPromptKey);
}

export function buildAgentRunDraft(
  agentId: AgentId,
  input: Record<string, unknown>,
  overrides?: Partial<Pick<AgentRunDraft, 'createdById' | 'mode'>>,
): AgentRunDraft {
  const agent = getAgentDefinition(agentId);

  return {
    agentName: agent.id,
    mode: overrides?.mode ?? agent.defaultMode,
    input,
    status: 'QUEUED',
    createdById: overrides?.createdById,
  };
}

export function buildAgentFindingDraft(
  finding: AgentFindingDraft,
): AgentFindingDraft {
  return {
    ...finding,
  };
}

export const AGENT_FRAMEWORK_METADATA = {
  phase: 2,
  startedAt: '2026-04-04',
  traceabilityTables: TRACEABILITY_TABLES,
  requiredAgents: AI_AGENT_IDS,
  executionPolicy: {
    manualApprovalRequiredForRiskyActions: true,
    promptVersioningEnabled: true,
    runsMustBeLogged: true,
  },
} as const;
