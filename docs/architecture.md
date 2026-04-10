# Arquitectura

## Vision

PrintOS AI se implementa como un monorepo con tres aplicaciones y cuatro paquetes compartidos:

- `apps/web`: experiencia publica y ecommerce en Next.js 14.
- `apps/admin`: panel interno, CRM, dashboard y produccion en Next.js 14.
- `apps/api`: backend principal en NestJS con Prisma, Redis y BullMQ.
- `packages/database`: modelo Prisma, seeds y scripts de base de datos.
- `packages/shared`: tipos, constantes, contratos de dominio y utilidades puras.
- `packages/ui`: componentes UI compartidos basados en shadcn/ui.
- `packages/ai-agents`: contratos y orquestacion futura de agentes IA.

## Flujo de datos

1. `web` y `admin` consumen `api` con TanStack Query.
2. `api` persiste el dominio en PostgreSQL via Prisma.
3. Redis soporta colas, cache y rate limiting.
4. MinIO almacena artes, mockups y exportaciones finales.
5. Todo evento relevante genera un `AuditLog`.

## Decisiones clave

- Se prioriza un backend modular por dominio para sostener la amplitud funcional de la Fase 1.
- El personalizador visual usara Konva en cliente y exportacion de arte en servidor mediante payload serializado.
- El pricing vive como logica de dominio compartida para reutilizarse entre frontend, backend y pruebas.

