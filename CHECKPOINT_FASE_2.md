# CHECKPOINT REPORT - FASE 2: Inteligencia Comercial

## Metadatos
- Fecha: 2026-04-05
- Rama git: feature/fase-1
- Commit hash: no disponible en este entorno local

## Modulos Completados
- [x] Framework de 7 agentes IA con definiciones, prompts y guardrails versionados
- [x] Corridas persistidas en `agent_runs`
- [x] Hallazgos persistidos en `agent_findings`
- [x] Senales persistidas en `social_signals`
- [x] Prospectador Local conectado a CRM, customers y catalogo
- [x] Escucha Social conectada a conversaciones y mensajes reales
- [x] Ejecutivo Comercial IA con borradores revisables
- [x] Community Manager IA conectado a `campaigns`, `content_calendar` y demanda detectada
- [x] Analista de Campanas conectado a `campaigns` y `ad_performance`
- [x] Coordinador Operativo conectado a pedidos, artes y tareas
- [x] Analista Financiero conectado a pedidos pagados y pricing rules
- [x] Bandeja de aprobacion humana para hallazgos y borradores
- [x] Panel de prompts/versionado editable desde admin
- [x] Flujo `Reactivacion 90 dias` conectado a leads, tareas y conversaciones EMAIL
- [x] Dashboard comercial avanzado con campanas, automatizaciones y omnicanalidad
- [x] Cierre formal de fase aprobado tras smoke test local final con launcher oficial

## Resultados de Tests
- Typecheck compartido: operativo en entorno local al levantar el stack
- Tests unitarios/E2E: no ejecutados desde este sandbox
- Cobertura: pendiente de corrida local consolidada

## Modulos Marcados como Mock/Simulados
- No se detectan mocks silenciosos de Fase 2 en los agentes conectados.

## Problemas Encontrados
- En Windows aparecian instancias stale del API/Nest por liberacion incompleta de puertos.
- El admin podia pegar a rutas internas obsoletas y devolver `Cannot POST` aunque el backend ya tuviera la ruta real.
- Docker Desktop requirio recuperacion automatizada para volver a un estado sano.

## Decisiones Tecnicas Tomadas
- El reinicio del entorno dev se endurecio para matar arboles completos de procesos y esperar puertos libres.
- Las mutaciones del admin ahora prefieren backend directo para reducir inconsistencias de App Router.
- `db:migrate` se mantiene sobre `prisma db push` hasta versionar migraciones reales.

## Instrucciones para Verificar
1. Ejecutar:
   `powershell -ExecutionPolicy Bypass -File C:\Users\darwinbarahona\Documents\SubliGo\infra\scripts\launch-all.ps1 -Seed`
2. Abrir:
   - `http://localhost:3100`
   - `http://localhost:3101/agentes`
   - `http://localhost:3101/crm`
   - `http://localhost:3102/api/docs`
3. En `/agentes`, ejecutar:
   - `Ejecutar trio inicial`
   - `Analista de campanas`
   - `Community Manager`
   - `Coordinador operativo`
   - `Analista financiero`
   - `Reactivacion 90 dias`
4. Verificar:
   - Corridas recientes con agentes de la fase
   - Hallazgos priorizados persistidos
   - Bandeja de aprobacion humana con borradores
   - Seccion de prompts/versionado visible
   - Automatizaciones con al menos una corrida o tareas recientes
5. En `/crm`, verificar dos o mas canales reales en inbox omnicanal

## Estado
APROBADA

Confirmado en la validacion local mostrada:
- arranque limpio de `web`, `admin` y `api`
- `Ejecutar fase 2` sin `500`
- `Reactivacion 90 dias` con efecto visible
- inbox omnicanal con 2 o mas canales reales
