# Roadmap

## Fase 1 - Fundacional

Estado: Aprobada

- [x] Estructura oficial del monorepo creada
- [x] Documentacion inicial obligatoria creada
- [x] Schema Prisma completo
- [x] Dominio compartido para pricing, diseno, ordenes y RBAC
- [x] API base con auth, catalogo, pricing, design, orders, CRM, dashboard y WhatsApp
- [x] Web inicial con landing, catalogo y personalizador interactivo
- [x] Admin inicial con dashboard, CRM, catalogo y produccion
- [x] Carrito persistente y checkout sandbox conectados al backend
- [x] Dashboard y produccion con datos reales desde la base
- [x] Upload de assets del cliente y persistencia en sesiones de diseno
- [x] Generacion local de arte final servida por la API
- [x] Seeds realistas del negocio
- [x] Docker y CI base configurados
- [x] Integracion del frontend con la API para catalogo, checkout y backoffice operativo
- [x] Validacion operativa de Docker, migraciones y pruebas en entorno ejecutable
- [x] Checkpoint de Fase 1 aprobado tras verificacion local

## Fase 2 - Inteligencia Comercial

Estado: Aprobada

- [x] Framework tipado de agentes, prompts y guardrails base
- [x] Persistencia real de corridas en `agent_runs`
- [x] Persistencia real de hallazgos en `agent_findings`
- [x] Persistencia real de senales en `social_signals`
- [x] Conexion de Prospectador Local, Escucha Social y Ejecutivo Comercial a datos reales
- [x] Panel inicial de agentes en admin para ejecucion manual y revision
- [x] Conexion de Community Manager IA a calendario editorial y datos reales de demanda
- [x] Conexion de Analista de Campanas a campanas y snapshots historicos reales
- [x] Conexion de Coordinador Operativo a pedidos, arte y tareas reales
- [x] Conexion de Analista Financiero a pedidos pagados, pricing rules y rentabilidad
- [x] Bandeja de aprobacion humana para borradores de agentes
- [x] Vista de prompts activos y versionado en el admin
- [x] Flujo de automatizacion comercial real de reactivacion conectado a tareas, leads y conversaciones
- [x] Inbox omnicanal visible con al menos dos canales reales tras ejecutar la automatizacion
- [x] Reinicio de entorno dev endurecido para evitar instancias stale del API y del admin en Windows
- [x] Mutaciones criticas del admin prefieren backend directo para evitar falsos 404/405 en rutas internas
- [x] Validacion local final del launcher oficial, agentes y CRM multicanal completada

## Fase 3 - Operacion Avanzada

Estado: Aprobada

- [x] Produccion avanzada con riesgo, tracking, SLA y tareas reales
- [x] Costos reales, margen y dispatch readiness por orden
- [x] Dashboard gerencial enriquecido con inteligencia comercial y finanzas operativas
- [x] P&L basico del periodo y forecasting inicial
- [x] Preparacion multi-sede con `tenantId` en tablas criticas

## Fase 4 - ERP Ligero

Estado: Aprobada y validada operativamente

- [x] Panel inicial de contabilidad operativa con cobros, conciliacion y readiness documental
- [x] Endpoint agregado para lectura contable consolidada desde pagos y ordenes reales
- [x] Facturacion operativa con emision, envio y lectura documental en backoffice
- [x] Control unificado desde un panel ERP
- [x] Validacion local de `/contabilidad`, `/facturacion`, `/erp` y Swagger levantando junto al resto del sistema

## Backlog post-fases

- [ ] Integracion normativa real de facturacion electronica local
- [ ] Mayor contable y asientos formales
- [ ] Conciliacion bancaria profunda y matching avanzado
- [ ] Hardening transversal de seguridad, observabilidad, migraciones y E2E
