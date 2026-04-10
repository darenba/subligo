# INSTRUCCIÓN MAESTRA PARA CODEX — PrintOS AI
**Versión 1.0 | Abril 2026 | Propietario: Darwin Barahona**

---

## ⚠️ LEE ESTO PRIMERO — PROTOCOLO DE TRABAJO

### Tu Rol
Eres el **desarrollador principal (Codex)**. Tu trabajo es CODIFICAR. No diseñas arquitectura sin documentarla. No cambias el stack sin justificarlo. No entregas fases incompletas.

### Rol de Claude (tu supervisor)
Claude revisa, evalúa, corrige y aprueba cada fase. Claude NO codifica. Sin aprobación de Claude no avanzas a la siguiente fase.

### Ciclo de Trabajo Obligatorio
1. Lee TODA esta especificación antes de escribir una línea de código
2. Implementa SOLO la Fase 1 inicialmente
3. Al terminar cada fase, genera el archivo `CHECKPOINT_FASE_X.md` (formato abajo)
4. Espera que Darwin lleve el checkpoint a Claude y traiga el veredicto
5. Si hay correcciones: corrige, actualiza el checkpoint, re-entrega
6. Si APROBADO: procede a la siguiente fase

---

## FORMATO DEL CHECKPOINT REPORT (obligatorio al terminar cada fase)

Crea el archivo `CHECKPOINT_FASE_X.md` en la raíz del repositorio:

```markdown
# CHECKPOINT REPORT — FASE [X]: [NOMBRE]

## Metadatos
- Fecha: YYYY-MM-DD
- Rama git: feature/fase-X
- Commit hash: [último commit]

## Módulos Completados
- [x] Módulo A — descripción breve
- [x] Módulo B — descripción breve
- [ ] Módulo C — NO completado — razón: [explicar]

## Resultados de Tests
- Unit tests: X pasaron / Y total
- E2E tests: X pasaron / Y total
- Cobertura: XX%

## Estructura de Archivos Entregados
```
(árbol de directorios con archivos creados/modificados)
```

## Decisiones Técnicas Tomadas
- [Decisión]: [Justificación técnica]

## Módulos Marcados como Mock/Simulados
- (Lista todo módulo no completamente funcional con comentario // MOCK en el código)

## Problemas Encontrados
- (Bloqueantes, limitaciones técnicas, deudas técnicas)

## Preguntas para Claude
- (Preguntas técnicas o de alcance que necesitan respuesta)

## Instrucciones para Verificar
1. git clone [repo] && cd printos-ai
2. docker compose up -d
3. npm run db:migrate && npm run db:seed
4. npm run dev
5. Verificar en http://localhost:3000 → [criterio específico]

## Estado
LISTO PARA REVISIÓN DE CLAUDE ✓
```

---

## ESTRUCTURA DE DIRECTORIOS REQUERIDA

```
printos-ai/
├── apps/
│   ├── web/              ← Next.js 14 (frontend público + ecommerce)
│   ├── admin/            ← Next.js 14 (panel interno, CRM, dashboard)
│   └── api/              ← NestJS (backend principal)
├── packages/
│   ├── database/         ← Prisma schema + migrations
│   ├── shared/           ← tipos, utils, constantes compartidas
│   ├── ai-agents/        ← lógica de agentes IA
│   └── ui/               ← componentes UI compartidos (shadcn/ui base)
├── docs/
│   ├── architecture.md
│   ├── modules.md
│   ├── schema.md
│   ├── ai-agents.md
│   ├── api-spec.md
│   ├── roadmap.md
│   ├── risks.md
│   └── DECISIONS.md
├── infra/
│   ├── docker/
│   └── scripts/
├── CHECKPOINT_FASE_1.md
├── docker-compose.yml
├── package.json          ← Turborepo + pnpm workspaces
├── turbo.json
├── .env.example
└── README.md
```

---

## REGLAS DE CALIDAD INVIOLABLES

1. **Cero hardcoding**: precios, márgenes, prompts y configuraciones → base de datos o `.env`
2. **Cero mocks silenciosos**: si un módulo está simulado, escribe `// MOCK: [razón]` y listarlo en el checkpoint
3. **Cero cambios de stack sin documentación**: cualquier desvío → justificar en `DECISIONS.md`
4. **Tests antes de checkpoint**: tests unitarios de cada módulo deben pasar
5. **Seeds realistas**: datos que simulan un negocio real de sublimación
6. **Docker-first**: el ambiente levanta con `docker compose up` sin configuración manual
7. **Mobile-first**: todo componente funciona en 375px antes de optimizar escritorio
8. **API-first**: toda funcionalidad expuesta como endpoint documentado
9. **Auditoría completa**: toda acción relevante escribe a `audit_logs`
10. **Manejo de errores**: sin excepciones sin capturar, sin pantallas de error genéricas

---

## SECCIÓN 1 — VISIÓN DEL PRODUCTO

### Nombre
**PrintOS AI** — Plataforma integral de sublimación, impresión digital y marketing automatizado.

### Usuarios del Sistema
| Usuario | Rol |
|---------|-----|
| Clientes finales | Compran y personalizan productos |
| Comercios y empresas | Pedidos corporativos, recompra |
| Diseñador | Crea plantillas, valida artes |
| Vendedor | Gestiona leads y cotizaciones |
| Encargado de producción | Gestiona órdenes de trabajo |
| Administrador/Gerencia | Panel completo, métricas, finanzas |
| Agente de marketing | Campañas, contenido, redes |
| Agente IA | Agentes automatizados del sistema |

---

## SECCIÓN 2 — STACK TÉCNICO MANDATORIO

No cambies este stack sin aprobación de Claude. Alternativas → documentar en `DECISIONS.md` antes de implementar.

### Frontend (apps/web y apps/admin)
- **Next.js 14+** (App Router) — framework principal
- **TypeScript** (strict mode — sin `any` implícito)
- **Tailwind CSS** — estilos (no CSS modules)
- **shadcn/ui** — componentes base
- **Zustand** — estado global
- **TanStack Query** — fetching y caching
- **Fabric.js o Konva.js** — editor de diseño 2D
- **Three.js** — solo para mockups 3D complejos
- **React Hook Form + Zod** — formularios con validación

### Backend (apps/api)
- **NestJS** — framework backend modular
- **PostgreSQL 16+** — base de datos principal
- **Prisma ORM** — acceso a datos
- **Redis** — caché, sesiones, colas
- **BullMQ** — colas de trabajos asíncronos
- **MinIO (local) / S3** — almacenamiento de archivos y artes
- **JWT + Passport** — autenticación
- **CASL** — autorización RBAC

### IA y Agentes
- Orquestación via BullMQ (jobs/eventos)
- Proveedor LLM intercambiable via adaptador (OpenAI por defecto)
- Motor de prompts versionado con panel de edición
- RAG para políticas, catálogos, FAQs

### Infraestructura
- Docker + Docker Compose (local y prod)
- GitHub Actions — CI/CD (lint, test, build)
- Pino — logs centralizados
- `.env.example` completo

---

## SECCIÓN 3 — MODELO DE DATOS

El schema de Prisma DEBE implementar TODAS estas entidades:

### Entidades Obligatorias

```prisma
// GESTIÓN DE USUARIOS Y ACCESO
model User { ... }
model Role { ... }
model Permission { ... }

// CLIENTES Y LEADS
model Customer { ... }        // Clientes con historial de compras
model Lead { ... }            // Prospectos con scoring
model Company { ... }         // Empresas B2B

// COMUNICACIONES
model Conversation { ... }    // Historial unificado omnicanal
model Message { ... }         // Mensajes individuales

// CATÁLOGO
model Product { ... }
model ProductCategory { ... }
model ProductVariant { ... }
model ProductPricingRule { ... }  // CRÍTICO: precio por unidad Y por área

// DISEÑO Y PRODUCCIÓN
model DesignTemplate { ... }
model DesignSession { ... }   // Sesión activa del personalizador
model Artwork { ... }         // Arte final generado para producción

// VENTAS
model Quote { ... }
model Order { ... }
model OrderItem { ... }
model Shipment { ... }
model Payment { ... }

// MARKETING
model Campaign { ... }
model CampaignAsset { ... }
model AdPerformance { ... }
model ContentCalendar { ... }

// OPERACIONES
model Task { ... }
model Automation { ... }

// AGENTES IA
model AgentRun { ... }        // Ejecuciones con log completo
model AgentFinding { ... }    // Hallazgos generados
model SocialSignal { ... }    // Señales de demanda detectadas

// ANALYTICS Y AUDITORÍA
model AnalyticsSnapshot { ... }
model AuditLog { ... }        // TODA acción relevante del sistema
```

---

## SECCIÓN 4 — MÓDULOS OBLIGATORIOS

### 4.1 Sitio Web y E-Commerce

**Páginas requeridas:**
- Landing premium con hero, propuesta de valor y CTA
- Catálogo por categorías
- Página de producto con personalizador integrado
- Carrito con resumen en tiempo real
- Checkout con envío y pasarela de pago
- Área del cliente (pedidos, diseños guardados)
- Blog/SEO, páginas corporativas, FAQs, testimonios

**Categorías base (deben existir en seeds):**
- Camisetas, Tazas, Gorras, Botellas/Tumblers, Mousepad
- Stickers, Etiquetas
- Banner/Lona, Microperforado, Vinil adhesivo, PVC, Coroplast
- Roll-up/X-Banner, Rótulos impresos
- Paquetes para negocios, Servicios corporativos

### 4.2 Diseñador Online / Personalizador Visual

⚠️ **MÓDULO CRÍTICO — No puede ser mock. Debe generar artes reales.**

**Capacidades obligatorias:**
- Vista previa en tiempo real del producto personalizado
- Texto editable: fuente, tamaño, color, alineación, rotación
- Imágenes subidas por cliente (con validación de resolución mínima)
- Clipart y plantillas prediseñadas
- Sistema de capas y alineación
- Zonas imprimibles definidas por tipo de producto
- Mockup visual por producto (frontal/posterior cuando aplique)
- Plantillas guardables por usuario
- Validación de calidad de imagen
- **Exportación de arte final (PNG/PDF alta resolución) al confirmar pedido**

**Lógica de precio — DOS modelos:**

```
PRECIO POR UNIDAD (camiseta, taza, gorra, botella, mousepad):
  precio_final = cantidad × precio_unitario × modificador_personalización
  Campos: cantidad, tipo_personalización, color_base, variante/talla, cara_1, cara_2
  NO pedir ancho/alto

PRECIO POR ÁREA (banner, lona, vinil, PVC, gran formato):
  precio_final = (ancho_m × alto_m) × precio_por_m2 + terminaciones + instalación
  Campos: ancho, alto, unidad (cm/pulgadas/pies/metros), conversión automática
  Calcular área y mostrar desglose en tiempo real
```

**Salida de producción (generada automáticamente al confirmar pedido):**
- Archivo maestro imprimible (PNG/PDF alta res)
- Resumen de producción con SKU de trabajo único
- Dimensiones finales confirmadas
- Observaciones del cliente
- Miniatura preview para el operador
- Datos de facturación/envío

### 4.3 CRM Comercial

**Funcionalidades núcleo:**
- Captura automática de leads desde formularios, WhatsApp y redes
- Pipeline visual por etapas: Nuevo → Contactado → Cotizado → Cerrado → Perdido
- Empresas y contactos con historial completo
- Scoring automático por comportamiento y valor potencial
- Recordatorios y tareas de seguimiento
- Historial unificado de conversaciones por cliente
- Cotizaciones generadas desde el CRM
- Tracking de oportunidades con motivo de cierre/pérdida
- Alertas de recompra y reactivación

---

## SECCIÓN 5 — SISTEMA DE AGENTES IA

⚠️ **REGLA DE SEGURIDAD**: Ningún agente puede publicar, enviar mensajes masivos ni gastar presupuesto sin aprobación humana. Esto es inviolable.

### Los 7 Agentes Requeridos

**Agente 1 — Prospectador Local**
Busca negocios potenciales por rubro y zona. Genera fichas con señal de oportunidad, necesidad probable, producto sugerido y prioridad.
Rubros: restaurantes, cafeterías, barberías, clínicas, ferreterías, tiendas, gimnasios, farmacias, iglesias, escuelas, emprendimientos.

**Agente 2 — Escucha Social / Demanda Pública**
Detecta señales públicas de intención de compra. Clasifica por urgencia, intención, valor potencial, localidad y canal de respuesta.
Señales: búsquedas de rótulos, banners, tazas/camisas personalizadas, inauguraciones, branding, packaging, señalización.

**Agente 3 — Ejecutivo Comercial IA**
Redacta mensajes de prospección, responde consultas, sugiere cotizaciones, hace seguimiento, reactiva leads fríos, recomienda upsell/cross-sell.
Opera con supervisión humana para envíos masivos.

**Agente 4 — Community Manager IA**
Crea parrillas de contenido, genera copys por red, propone ideas para videos cortos, adapta contenido por plataforma, recicla casos de éxito.
NUNCA publica sin aprobación humana. Solo genera borradores.

**Agente 5 — Analista de Campañas**
Monitorea métricas publicitarias, identifica anuncios malos, propone creativos, sugiere redistribución de presupuesto.

**Agente 6 — Coordinador Operativo**
Revisa carga de producción, prioriza pedidos, alerta cuellos de botella, controla tiempos de entrega, recomienda compras de insumos.

**Agente 7 — Analista Financiero**
Estima margen por producto, detecta baja rentabilidad, analiza ticket promedio, calcula CAC estimado, mide retorno por campaña.

### Requerimientos Técnicos del Framework

- Todos los agentes escriben a `agent_runs` y `agent_findings`
- Motor de prompts con panel de edición, versionado, variables dinámicas, rollback
- Memoria empresarial: historial de clientes, campañas, catálogos, FAQs
- Guardrails: no prometer fechas imposibles, no ofrecer descuentos no autorizados, no inventar stock
- Modo manual, semiautomático y automático configurable por agente
- Interfaz de aprobación para acciones de riesgo

---

## SECCIÓN 6 — ATENCIÓN OMNICANAL

### Canales Integrados
- WhatsApp Business (API oficial Meta — NO terceros)
- Instagram Direct Messages (Graph API)
- Facebook Messenger
- Email transaccional + bandeja
- Web chat widget
- Formularios del sitio

### Bandeja Omnicanal
- Vista unificada de todas las conversaciones
- Clasificación automática por intención y urgencia
- Respuestas sugeridas por IA (con aprobación)
- Asignación a operadores
- SLA configurable con alertas
- Detección de intención: consulta, cotización, queja, urgente

### Flujos de Marketing Automation
| Flujo | Trigger |
|-------|---------|
| Bienvenida | Registro nuevo cliente |
| Abandono de carrito | Carrito sin checkout > 2h |
| Cotización no cerrada | Sin respuesta > 48h |
| Seguimiento postventa | Pedido entregado +3 días |
| Solicitud de reseña | Pedido completado +7 días |
| Recompra por temporada | Fecha especial + historial |
| Campaña por fecha | Navidad, San Valentín, etc. |
| Reactivación | Sin compra > 90 días |

---

## SECCIÓN 7 — DASHBOARD Y BACKOFFICE

### Dashboard Gerencial (datos REALES de la BD — NO decorativo)
- Ventas por día/semana/mes y por categoría
- Ticket promedio por segmento
- Leads captados y calificados
- Tasa de conversión web
- Tiempos de producción y pedidos retrasados
- Campañas activas y ROAS estimado
- Productos con margen bajo
- Tasa de recompra y recurrencia
- CAC por canal, CPL por fuente

### Backoffice de Productos y Producción
- Catálogo maestro CRUD completo
- Costos y márgenes configurables por categoría
- Reglas de precio (unidad y área)
- Estados de producción: Recibido → En producción → Listo → Despachado → Entregado → Incidencia
- Panel de despachos con tracking

---

## SECCIÓN 8 — FLUJOS CRÍTICOS

### Flujo 1: Compra Personalizada (E2E)
1. Cliente entra al producto
2. Abre el personalizador → agrega texto/imagen
3. Ve preview en tiempo real
4. Sistema valida calidad del diseño
5. Precio se recalcula en tiempo real
6. Cliente agrega al carrito
7. Checkout: dirección + método de envío/retiro
8. Pago vía pasarela integrada
9. Sistema genera arte final (PNG/PDF alta res)
10. Sistema crea orden de producción con SKU, arte y datos
11. Sistema notifica al cliente por email y WhatsApp
12. Equipo ve la orden en su panel de producción

### Flujo 2: Lead Intelligence
1. Agente detecta negocio o señal pública
2. Crea lead con ficha completa
3. Calcula score y prioridad
4. Propone mensaje de contacto
5. Humano aprueba (o envía según reglas)
6. Respuesta entra a la bandeja omnicanal
7. Lead entra al pipeline del CRM

### Flujo 3: Contenido y Campañas
1. Agente analiza temporada/stock/oportunidad
2. Propone campaña con objetivo y piezas
3. Genera copys por red social
4. Humano revisa y aprueba
5. Sistema exporta/publica según canal
6. Agente analiza rendimiento y retroalimenta

---

## SECCIÓN 9 — FASES DE EJECUCIÓN

> ⚠️ IMPLEMENTA UNA FASE A LA VEZ. Entrega CHECKPOINT REPORT al terminar. Espera aprobación de Claude. No saltes ni combines fases.

---

### FASE 1 — Fundacional (PRIORIDAD CRÍTICA)

La base sobre la que todo lo demás funciona. Sin Fase 1 aprobada no hay Fase 2.

**Módulos a entregar:**
- [ ] Monorepo configurado (Turborepo + pnpm workspaces)
- [ ] Schema Prisma completo con TODAS las entidades
- [ ] Autenticación y RBAC: registro, login JWT, 5 roles
- [ ] Catálogo de productos: CRUD completo con variantes
- [ ] **Personalizador visual funcional**: editor, preview, guardado en BD
- [ ] **Lógica de precios DUAL**: precio por unidad Y precio por área
- [ ] E-commerce: carrito, checkout, pago en sandbox
- [ ] **Generación de arte final** al confirmar pedido
- [ ] Orden de producción en backoffice con el arte
- [ ] CRM básico: leads, pipeline, cotizaciones
- [ ] WhatsApp Business: configuración y recepción
- [ ] Dashboard con datos reales de ventas
- [ ] Seeds realistas (5+ productos, 3+ clientes, 2+ pedidos, diseños)
- [ ] Docker Compose funcional (levanta todo con un comando)
- [ ] Tests unitarios de personalizador, precios y pedidos

**Criterios de aceptación — FASE 1 SE ACEPTA SOLO SI:**
1. Un cliente personaliza un producto, hace checkout y se genera una orden de producción real
2. La lógica de precio por UNIDAD y por ÁREA funciona correctamente
3. El CRM puede recibir y gestionar un lead
4. El dashboard muestra datos reales (no mock ni hardcodeados)
5. `docker compose up && npm run db:seed && npm run dev` levanta sin errores

---

### FASE 2 — Inteligencia Comercial

**Módulos a entregar:**
- [ ] Framework de 7 agentes IA con logs en `agent_runs`
- [ ] Scoring avanzado de leads
- [ ] Bandeja omnicanal unificada (WhatsApp + Instagram + Email + web chat)
- [ ] Motor de prompts con panel de edición y versionado
- [ ] 8 flujos de marketing automation
- [ ] Generación de contenido con IA (parrilla editorial)
- [ ] Panel de campañas y reporting
- [ ] Analytics avanzado: CAC, CPL, tasa de cierre, lead-to-order time

**Criterios de aceptación — FASE 2 SE ACEPTA SOLO SI:**
1. Al menos 3 agentes ejecutan y dejan trazabilidad en `agent_runs`
2. La bandeja omnicanal muestra mensajes reales de 2+ canales
3. Un flujo de automation completo se ejecuta de inicio a fin
4. El motor de prompts permite editar y versionar desde el panel

---

### FASE 3 — Operación Avanzada

**Módulos a entregar:**
- [ ] Panel de producción completo con estados y asignación
- [ ] Gestión de despachos con tracking
- [ ] Costos reales y control de insumos
- [ ] Finanzas operativas: P&L estimado por producto y período
- [ ] Forecasting de ventas básico
- [ ] Arquitectura multi-sede preparada (campo `tenantId` en tablas críticas)

---

### FASE 4 — ERP Ligero

**Módulos a entregar:**
- [ ] Facturación electrónica (según normativa local)
- [ ] Contabilidad operativa básica
- [ ] Conciliación de pagos
- [ ] Control total desde un solo panel

---

## SECCIÓN 10 — ESTÁNDARES DE UX/UI

El diseño es parte de los criterios de aceptación.

| Área | Estándar |
|------|---------|
| General | Visual premium, limpio, moderno. Dashboard estilo SaaS. CERO admin genérico. |
| E-commerce | Hero impactante, personalizador simple, preview visible, precio en tiempo real, CTA fuerte |
| CRM | Pipeline tipo Kanban, tarjetas con score, línea de tiempo, bandeja usable |
| Dashboard | Métricas accionables, alertas, tendencias, rankings |
| Mobile | Mobile-first. Usable en 375px sin scroll horizontal |
| Performance | LCP < 2.5s, FID < 100ms, CLS < 0.1 |

---

## SECCIÓN 11 — SEGURIDAD

- RBAC completo con CASL — todo endpoint verifica permisos
- `audit_logs` para toda acción relevante
- Secretos en `.env` — nunca en código fuente
- 2FA obligatorio para administradores
- Rate limiting en el personalizador
- Solo APIs oficiales para WhatsApp, Instagram, Messenger
- HTTPS en producción

---

## SECCIÓN 12 — DOCUMENTACIÓN REQUERIDA

Crear y mantener actualizada en `/docs/`:

| Archivo | Contenido |
|---------|-----------|
| `architecture.md` | Diagrama, decisiones técnicas, flujo de datos |
| `modules.md` | Módulos, responsabilidades, dependencias |
| `schema.md` | Esquema BD con descripción de tablas |
| `ai-agents.md` | Cada agente, prompts, herramientas, flujo |
| `api-spec.md` | Especificación OpenAPI completa |
| `roadmap.md` | Estado de cada fase |
| `risks.md` | Riesgos técnicos y mitigaciones |
| `DECISIONS.md` | Decisiones técnicas con justificaciones |

---

## SECCIÓN 13 — ENTREGABLES COMPLETOS

### Código
- Frontend completo (web + admin)
- Backend completo (NestJS API)
- Schema y migrations de BD
- Seeds realistas del negocio
- Autenticación y RBAC
- Todas las integraciones base
- Editor/personalizador funcional
- CRM funcional
- Dashboards con datos reales

### Calidad
- Tests unitarios de módulos críticos
- Tests E2E de flujos críticos
- Linters configurados (ESLint + Prettier)
- Validaciones en todos los formularios
- Manejo de errores con mensajes útiles
- Logs estructurados (Pino)

### DevOps
- `docker-compose.yml` funcional
- Scripts de setup automático
- `.env.example` completo
- GitHub Actions CI/CD base
- README de despliegue

---

## SECCIÓN 14 — CRITERIOS FINALES

### EL SISTEMA NO SE ACEPTA SI:
- El personalizador es solo mock o decorativo
- No genera archivos utilizables para producción
- El CRM no maneja leads reales con pipeline funcional
- Los agentes no dejan trazabilidad en `agent_runs`
- El dashboard muestra datos hardcodeados (no de la BD)
- El pricing no soporta precio por unidad Y por área
- El sitio no es mobile-first
- La mensajería no está unificada en una bandeja

### EL SISTEMA SÍ SE ACEPTA CUANDO:
- Un cliente puede personalizar, pagar y generar una orden real
- El negocio puede captar, responder y seguir leads desde múltiples canales
- Los agentes generan valor medible con trazabilidad completa
- La operación puede crecer sin rehacer la plataforma
- Todo levanta con `docker compose up` + seed sin configuración manual

---

## NOTA FINAL

Este es un sistema real para un negocio real. No es un ejercicio académico.

**Prioridades en orden:**
1. Arquitectura sólida
2. Funcionalidad completa
3. Código limpio
4. Velocidad de entrega

Nunca sacrifiques arquitectura por velocidad.

Si encuentras una limitación técnica seria, una inconsistencia en la spec, o una alternativa claramente superior, documéntala en `DECISIONS.md` y comunícala en el checkpoint. Claude evaluará y decidirá.

---

*PrintOS AI — Especificación v1.0 — Abril 2026*
*Supervisor de calidad: Claude | Desarrollador: Codex | Propietario: Darwin Barahona*
