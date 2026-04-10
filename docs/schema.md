# Esquema de Base de Datos

La fuente de verdad del modelo relacional es `packages/database/prisma/schema.prisma`.

## Bloques funcionales

- Identidad y acceso: `User`, `Role`, `Permission`
- CRM: `Customer`, `Lead`, `Company`, `Conversation`, `Message`
- Catalogo: `Product`, `ProductCategory`, `ProductVariant`, `ProductPricingRule`
- Diseno y produccion: `DesignTemplate`, `DesignSession`, `Artwork`
- Ventas: `Quote`, `Order`, `OrderItem`, `Shipment`, `Payment`
- Marketing: `Campaign`, `CampaignAsset`, `AdPerformance`, `ContentCalendar`
- Operaciones: `Task`, `Automation`
- IA: `AgentRun`, `AgentFinding`, `SocialSignal`
- Analitica y auditoria: `AnalyticsSnapshot`, `AuditLog`

## Reglas funcionales

- Todo precio relevante se calcula con reglas persistidas, nunca con hardcoding.
- Las acciones criticas se auditan.
- La capa multi-sede queda preparada con `tenantId` en tablas criticas para una futura activacion por sede.
- Las ordenes ya soportan costos reales desagregados en materiales, mano de obra, envio y overhead.
