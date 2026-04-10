# Agentes IA

La Fase 2 inicia sobre una base ya existente en la base de datos y ahora suma un primer slice de
framework en `packages/ai-agents`.

## Entidades ya disponibles

- `AgentRun`
- `AgentFinding`
- `SocialSignal`

## Slice actual entregado

- Registro tipado de los 7 agentes requeridos.
- Prompt registry versionado, un prompt base por agente.
- Guardrails globales y acciones que siempre requieren aprobacion humana.
- Metadatos de trazabilidad para `agent_runs`, `agent_findings` y `social_signals`.
- Helpers puros para construir borradores de ejecucion y hallazgos.
- Persistencia real de corridas en `agent_runs`.
- Persistencia real de hallazgos en `agent_findings`.
- Persistencia real de senales comerciales en `social_signals`.
- Conexion operativa de los primeros 3 agentes sobre datos del negocio.
- Panel inicial en admin para ejecutar corridas y revisar resultados.
- Community Manager IA conectado a `content_calendar` y flujo de revision humana.
- Analista de Campanas conectado a `campaigns` y `ad_performance`.
- Coordinador Operativo conectado a pedidos, arte final y tareas del dia.
- Analista Financiero conectado a pedidos pagados y pricing rules activas.
- Bandeja de aprobacion humana para `content-draft` y `commercial-draft`.
- Vista de prompts activos con versionado visible.
- Aprobaciones de recomendaciones de campana crean tareas operativas trazables.
- Aprobaciones de hallazgos operativos y financieros crean tareas genericas desde `taskSuggestion`.
- Automatizacion `Reactivacion 90 dias` conectada a `automations`, `tasks`, `leads` y
  conversaciones EMAIL.
- El panel del admin ya muestra automatizaciones comerciales y un checklist operativo del corte.
- El CRM ahora expone evidencia del inbox omnicanal cuando conviven conversaciones de mas de un
  canal real.

## Los 7 agentes

- Prospectador Local
- Escucha Social / Demanda Publica
- Ejecutivo Comercial IA
- Community Manager IA
- Analista de Campanas
- Coordinador Operativo
- Analista Financiero

## Guardrails obligatorios

- No publicar sin aprobacion humana.
- No enviar mensajes masivos sin aprobacion humana.
- No ofrecer descuentos no autorizados.
- No prometer stock o fechas inexistentes.
- No gastar presupuesto sin aprobacion humana.
- Toda ejecucion debe dejar trazabilidad.

## Trio inicial conectado

- Prospectador Local: trabaja sobre leads abiertos, cuentas reactivables y productos destacados.
- Escucha Social / Demanda Publica: transforma conversaciones reales en `social_signals`.
- Ejecutivo Comercial IA: genera borradores de seguimiento comercial con oferta sugerida.

## Proximo salto de Fase 2

- Validar operativamente el flujo de `Reactivacion 90 dias` y dejar evidencia de CRM multicanal.
- Extender el panel para navegar tareas creadas por aprobacion humana y por automatizaciones.
- Afinar `community-manager` para calendarizacion y revision editorial por lote.
