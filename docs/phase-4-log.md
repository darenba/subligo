# Phase 4 Log

## Estado

Cierre funcional implementado en entorno local.

## Slice inicial implementado

- Se agrego `GET /api/dashboard/accounting-overview` para consolidar pagos, conciliacion y readiness documental.
- Se agregaron `GET /api/billing/overview`, `GET /api/billing/invoices`, `POST /api/billing/invoices/issue-ready` y `POST /api/billing/invoices/send-pending`.
- Se agrego la vista admin `http://localhost:3101/contabilidad`.
- Se agrego la vista admin `http://localhost:3101/facturacion`.
- Se agrego la vista admin `http://localhost:3101/erp`.
- La vista presenta:
  - cobrado, por cobrar, reembolsado y pagos por conciliar
  - mix por proveedor
  - cola de conciliacion manual
  - readiness documental para emision comercial
  - timeline de cobranza
- La capa de facturacion ya permite:
  - detectar ordenes pagadas listas para emitir
  - emitir facturas operativas con numero, serie, CAI interno y snapshot documental
  - enviar facturas pendientes
  - visualizar XML/PDF y estados desde admin
- El panel ERP unifica:
  - dashboard comercial
  - CRM omnicanal
  - produccion y despacho
  - P&L operativo
  - contabilidad
  - facturacion
  - aprobaciones IA

## Pendientes fuera del cierre funcional de Fase 4

- Integracion normativa real con proveedor o autoridad de facturacion electronica local
- Asientos contables formales y mayor general
- Conciliacion bancaria profunda con aprobacion explicita y matching avanzado
- Politicas fiscales, series oficiales y timbrado regulatorio real
