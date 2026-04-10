# Skills listas para Subligo

## Resumen

Para este proyecto quedaron listas estas skills y flujos de trabajo:

- `imagegen`
  - Ya viene disponible en el entorno actual.
  - Es la mejor skill disponible para generacion y edicion de imagenes raster.
- `skills/subligo-ui-ux-review/SKILL.md`
  - Skill local del proyecto para mejoras UI/UX de web y admin.
- `skills/subligo-image-pipeline/SKILL.md`
  - Skill local del proyecto para preparar mockups, vistas de producto y activos visuales.

## Busqueda e instalacion externa

Se intento consultar el instalador remoto de skills, pero el entorno actual no permite acceso saliente a GitHub.

Error observado:

- `WinError 10013` al intentar abrir socket HTTPS desde `list-skills.py`

Por esa razon:

- no fue posible descargar skills externas en esta sesion
- si en otra sesion o maquina se habilita red, se puede volver a ejecutar `skill-installer`

## Recomendacion practica

Mientras la red siga bloqueada, usa:

1. `imagegen` para generacion/edicion de imagenes
2. `subligo-ui-ux-review` para revisar y ajustar layout, jerarquia y conversion
3. `subligo-image-pipeline` para mockups, recortes y vistas por superficie

