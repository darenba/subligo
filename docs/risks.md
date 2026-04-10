# Riesgos

## Riesgos tecnicos actuales

- El sandbox actual impide ejecutar scripts de Node desde esta ruta, lo que puede bloquear validaciones locales automatizadas hasta resolver la ejecucion fuera de sandbox.
- La amplitud funcional de la Fase 1 exige priorizar un vertical slice real antes de ampliar UX y automatizaciones.
- Las integraciones oficiales de Meta y pasarela de pago requieren credenciales reales para completar pruebas E2E finales.

## Mitigaciones

- Mantener logica critica desacoplada y probada con funciones puras.
- Documentar cualquier limitacion de entorno en checkpoints.
- Construir contratos claros para reemplazar facilmente credenciales sandbox por reales.

