# API Spec

La API se organiza por dominios NestJS y expone endpoints REST documentados con OpenAPI en
`http://localhost:3102/api/docs`.

## Modulos operativos

- `/auth`
- `/catalog`
- `/design`
- `/pricing`
- `/orders`
- `/crm`
- `/dashboard`
- `/billing`
- `/agents`
- `/automations`
- `/whatsapp`

## Contratos principales vigentes

- Auth: registro, login y perfil autenticado.
- Catalogo: lectura de categorias, productos, detalle por slug y reglas de pricing asociadas.
- Design: sesiones de personalizacion, upload de assets y persistencia de canvas.
- Orders: checkout sandbox, detalle de orden, cola de produccion y confirmacion de pago.
- CRM: leads, pipeline, customers y conversaciones.
- Dashboard: KPIs agregados sobre datos reales de la base.
- Dashboard: KPIs agregados, finanzas operativas y lectura contable inicial sobre pagos reales.
- Billing: overview de facturacion, listado de facturas y acciones de emision/envio documental.
- Agents: definiciones, corridas, hallazgos, review queue, prompts y senales comerciales persistidas para la Fase 2.
- Automations: inventario de flujos y ejecucion comercial de reactivacion.
- WhatsApp: verificacion de webhook y recepcion de mensajes entrantes.

## Endpoints implementados y verificados

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/catalog/categories`
- `GET /api/catalog/products`
- `GET /api/catalog/products/:slug`
- `POST /api/pricing/calculate`
- `POST /api/pricing/convert`
- `POST /api/design/assets`
- `POST /api/design/sessions`
- `GET /api/design/sessions`
- `GET /api/design/sessions/:id`
- `PATCH /api/design/sessions/:id`
- `POST /api/orders`
- `POST /api/orders/checkout`
- `GET /api/orders`
- `GET /api/orders/production-queue`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/status`
- `POST /api/orders/:id/confirm-payment`
- `GET /api/crm/customers`
- `POST /api/crm/customers`
- `GET /api/crm/leads`
- `POST /api/crm/leads`
- `PATCH /api/crm/leads/:id`
- `PATCH /api/crm/leads/:id/stage`
- `GET /api/crm/pipeline`
- `GET /api/crm/conversations`
- `GET /api/dashboard`
- `GET /api/dashboard/activity`
- `GET /api/dashboard/sales-timeline`
- `GET /api/dashboard/commercial-intelligence`
- `GET /api/dashboard/operations-finance`
- `GET /api/dashboard/accounting-overview`
- `GET /api/billing/overview`
- `GET /api/billing/invoices`
- `POST /api/billing/invoices/issue-ready`
- `POST /api/billing/invoices/send-pending`
- `GET /api/agents/definitions`
- `GET /api/agents/runs`
- `GET /api/agents/runs/:id`
- `GET /api/agents/findings`
- `GET /api/agents/review-queue`
- `GET /api/agents/prompts`
- `PATCH /api/agents/prompts/:key`
- `GET /api/agents/social-signals`
- `POST /api/agents/execute`
- `POST /api/agents/execute/initial-wave`
- `POST /api/agents/execute/phase-two-wave`
- `POST /api/agents/findings/:id/review`
- `GET /api/automations`
- `POST /api/automations/reactivation/run`
- `GET /api/whatsapp/webhook`
- `POST /api/whatsapp/webhook`

## Deuda no bloqueante documentada

- El catalogo maestro del backoffice ya consume datos reales, pero la iteracion cerrada de Fase 1
  valida lectura operativa; la superficie completa de escritura administrativa queda como siguiente
  endurecimiento funcional.
- `npm run db:migrate` usa `prisma db push` mientras no exista carpeta versionada de migraciones.
- El siguiente salto de storage sera versionar salida a MinIO/S3 sobre la base local ya funcional.
- Fase 2 ya expone los 7 agentes conectados, prompts versionados, review queue y automatizaciones;
  el siguiente salto ya pertenece a operacion avanzada, no a inteligencia comercial base.
- La facturacion electronica implementada en entorno local es operativa a nivel interno; la integracion
  regulatoria real con proveedor o autoridad fiscal queda como backlog post-fases.
