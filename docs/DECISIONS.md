# Decisiones Tecnicas

## ADR-001: Monorepo con aplicaciones separadas

- Fecha: 2026-04-04
- Decision: usar `apps/web`, `apps/admin` y `apps/api` con paquetes compartidos.
- Justificacion: separa responsabilidades, facilita despliegue y mantiene reutilizacion de dominio.

## ADR-002: Personalizador basado en Konva

- Fecha: 2026-04-04
- Decision: usar un editor 2D en cliente y serializar la sesion para exportar arte final.
- Justificacion: cumple la necesidad de un personalizador funcional y escalable a mockups mas complejos.

## ADR-003: Pricing dual compartido

- Fecha: 2026-04-04
- Decision: ubicar la logica de pricing dual en `packages/shared`.
- Justificacion: evita inconsistencias entre UI, API y pruebas.

## ADR-004: Limitacion temporal del entorno

- Fecha: 2026-04-04
- Decision: continuar la implementacion a nivel de codigo aunque el sandbox actual no permita ejecutar scripts Node sobre esta ruta.
- Justificacion: no detiene el avance estructural ni el desarrollo de modulos; la verificacion operativa quedara documentada para validarse en un entorno sin esa restriccion.

## ADR-005: Inicializacion local del schema sin migraciones versionadas

- Fecha: 2026-04-04
- Decision: usar `prisma db push` en `npm run db:migrate` como mecanismo temporal de inicializacion local mientras no exista una carpeta `packages/database/prisma/migrations` versionada.
- Justificacion: permite alinear la base local con el schema actual durante la Fase 1, pero la deuda de migraciones formales queda abierta y documentada para el siguiente cierre operativo.
