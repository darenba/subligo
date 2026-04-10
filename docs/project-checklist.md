# Checklist Maestro del Proyecto

## Estado actual

- Fase 1: cerrada y validada operativamente
- Fase 2: cerrada y validada operativamente
- Fase 3: cerrada y validada operativamente
- Fase 4: cerrada y validada operativamente

## Checklist de cierre - Fase 2

- [x] Framework de 7 agentes IA visible en panel
- [x] Registro de corridas en `agent_runs`
- [x] Registro de hallazgos en `agent_findings`
- [x] Registro de senales en `social_signals`
- [x] Prospectador Local conectado a datos reales
- [x] Escucha Social conectada a datos reales
- [x] Ejecutivo Comercial IA conectado a datos reales
- [x] Community Manager IA conectado a datos reales
- [x] Analista de Campanas conectado a datos reales
- [x] Coordinador Operativo conectado a datos reales
- [x] Analista Financiero conectado a datos reales
- [x] Motor de prompts visible, editable y versionado
- [x] Bandeja de aprobacion humana operativa
- [x] Panel de campanas y reporting avanzado operativo
- [x] Flujo `Reactivacion 90 dias` implementado end-to-end
- [x] Inventario base de 8 automatizaciones registrado
- [x] Launcher oficial estable despues de reinicio limpio en Windows
- [x] Smoke test final despues de reinicio limpio con launcher oficial
- [x] Ejecucion de `Ejecutar fase 2` sin `500` ni `ECONNREFUSED`
- [x] Confirmacion visual en `/crm` de 2 o mas canales reales despues de ejecutar reactivacion
- [x] Emision de `CHECKPOINT_FASE_2.md` como aprobado final tras esa verificacion

## Checklist de faltantes para terminar el proyecto completo

### Fase 3 - Operacion Avanzada

- [x] Panel de produccion completo con asignacion de responsables y trazabilidad operativa
- [x] Gestion de despachos con tracking y estados de entrega
- [x] Costos reales por orden, producto y consumo de insumos
- [x] Finanzas operativas con P&L por producto y por periodo
- [x] Forecasting de ventas basico
- [x] Arquitectura multi-sede preparada con `tenantId` en tablas criticas

### Fase 4 - ERP Ligero

- [x] Contabilidad operativa basica inicial con panel de cobros y readiness documental
- [x] Conciliacion de pagos inicial con cola de revision manual por proveedor
- [x] Facturacion operativa con emision, envio, XML/PDF y estados visibles
- [x] Control total desde un solo panel ERP

### Backlog post-fases

- [ ] Integracion normativa real de facturacion electronica local
- [ ] Mayor contable y asientos formales
- [ ] Conciliacion bancaria avanzada con matching y aprobacion profunda

### Endurecimientos transversales pendientes

- [ ] Migraciones Prisma versionadas en carpeta real de `migrations/`
- [ ] Suite de tests consolidada para Fase 2 y flujos de negocio criticos
- [ ] Cobertura E2E de e-commerce, CRM, agentes y automatizaciones
- [ ] Escritura administrativa completa del catalogo desde backoffice
- [ ] Endurecimiento de seguridad: 2FA admin, rate limiting y revision RBAC completa
- [ ] Observabilidad y monitoreo mas alla del logging base
- [ ] Storage versionado en MinIO/S3 para artes y activos finales
- [ ] Hardening de performance y objetivos LCP/FID/CLS en frontend

## Comando canonico de arranque

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\darwinbarahona\Documents\SubliGo\infra\scripts\launch-all.ps1 -Seed
```

## Validacion minima recomendada

1. Abrir `http://localhost:3100`
2. Abrir `http://localhost:3101/agentes`
3. Ejecutar `Ejecutar trio inicial`
4. Ejecutar `Reactivacion 90 dias`
5. Abrir `http://localhost:3101/crm`
6. Verificar al menos dos canales reales
7. Abrir `http://localhost:3102/api/docs`
