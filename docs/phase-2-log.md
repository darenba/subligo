# Bitacora Fase 2

## 2026-04-04

- Se da por cerrada la Fase 1 a nivel operativo tras validar `docker compose up`, `db:migrate`,
  `db:seed`, `npm run dev`, `web`, `admin` y `api/docs`.
- Se inicia la Fase 2 por un slice seguro en `packages/ai-agents`, preparando un registro tipado de
  agentes, prompts versionados, guardrails y metadatos de trazabilidad para `agent_runs`,
  `agent_findings` y `social_signals`.
- Se limpia la documentacion para que las promesas operativas de Fase 1 coincidan con lo verificado
  realmente en runtime.
- Se suaviza el reparador de Docker Desktop para evitar ruido de permisos ACL cuando el recovery ya
  es exitoso.
- Se implementa `api/agents` para persistir corridas reales en `agent_runs`, hallazgos en
  `agent_findings` y senales de demanda en `social_signals`.
- Se conectan Prospectador Local, Escucha Social y Ejecutivo Comercial a leads, customers,
  conversaciones, mensajes y catalogo del negocio.
- Se expone un panel inicial de agentes en el admin para lanzar corridas manuales y revisar
  definiciones, hallazgos y senales persistidas.
- Se conecta `community-manager` a `social_signals`, productos activos, campanas y
  `content_calendar`, generando borradores persistidos que quedan en `REQUIRES_REVIEW`.
- Se agrega una bandeja de aprobacion humana en el panel de agentes para aprobar o rechazar
  borradores comerciales y editoriales.
- Se expone el registro de prompts/versionado via API y se refleja en el admin para trazabilidad
  operativa.
- Se conecta `analista-campanas` a `campaigns` y `ad_performance`, generando hallazgos de escala,
  fatiga creativa o inversion ineficiente sobre snapshots historicos reales.
- Se extiende la aprobacion humana para que las recomendaciones aprobadas de campanas creen tareas
  operativas trazables en `tasks`.
- Se refrescan los seeds de Fase 2 para incluir campanas, assets, contenido editorial base y
  performance historico reproducible en entornos locales.
- Se conecta `coordinador-operativo` a pedidos, arte final y tareas para detectar bloqueos de
  produccion y crear acciones aprobables.
- Se conecta `analista-financiero` a pedidos pagados y pricing rules para detectar margen bajo,
  ticket promedio y focos de cuenta.
- La aprobacion humana ahora puede crear tareas operativas genericas desde hallazgos con
  `taskSuggestion`, no solo desde campanas.
- El panel de agentes del admin ya expone los 7 agentes conectados en Fase 2 y deja vacia la
  seccion de "Siguiente ola" cuando el framework ya esta completo para este corte.
- Se agrega `AutomationsModule` y el flujo `Reactivacion 90 dias`, capaz de crear leads, tareas y
  conversaciones EMAIL trazables sobre cuentas con mas de 90 dias sin compra.
- El admin suma proxy interno y panel visible para ejecutar la automatizacion comercial desde
  `/agentes` sin depender de llamadas manuales a Swagger.
- Los seeds ahora incluyen una cuenta reactivable con pedido historico viejo para demostrar el flujo
  end-to-end de reactivacion.
- El CRM muestra resumen de canales y evidencia visual del inbox omnicanal cuando hay al menos dos
  canales reales (por ejemplo WHATSAPP + EMAIL).
- El launcher `launch-all.ps1` se simplifica para evitar fallos por `Tee-Object` y locks de logs al
  reiniciar el entorno dev desde PowerShell.
- Se endurece `restart-dev.ps1` para matar arboles completos de procesos Node/Next/Nest en Windows y
  esperar la liberacion real de los puertos 3100, 3101 y 3102 antes de relanzar.
- El admin cambia su estrategia de mutaciones para preferir backend directo en `POST/PATCH/PUT/DELETE`,
  reduciendo falsos `Cannot POST` y errores por proxies internos stale en App Router.
- Se endurece `run-api-dev.mjs` para reparar `node_modules` de `apps/api` sin depender de `rm -r`
  sobre carpetas bloqueadas por Windows, evitando caidas por `EBUSY` durante el arranque.
- El runner del API ahora espera mejor el entrypoint compilado en `dist/` antes de reiniciar,
  reduciendo falsos fallos por reinicios adelantados.
- Las waves de agentes (`initial` y `phase-two`) dejan de abortar todo el request ante un solo
  agente fallido: ahora devuelven resultado parcial y lista de errores para mejorar la operacion.
- Los proxies internos del admin para ejecucion de agentes y automatizaciones ahora devuelven `503`
  con mensaje legible cuando el backend no esta disponible, en lugar de `500` opacos.
