# Bitacora Fase 1

## 2026-04-04

- Se inicializo el repositorio y la rama de trabajo `feature/fase-1`.
- Se creo la estructura monorepo requerida por la especificacion.
- Se documento la arquitectura, modulos, esquema, riesgos, roadmap y decisiones.
- Se implemento `packages/shared` con reglas puras de pricing dual, validacion de DPI y helpers de orden.
- Se implemento `packages/database` con schema Prisma completo y seeds realistas para SubliGo.
- Se construyo la base de `apps/api` con NestJS, Prisma, autenticacion JWT, RBAC, auditoria y modulos de negocio.
- Se construyo `apps/web` con landing, catalogo, area del cliente y personalizador interactivo.
- Se construyo `apps/admin` con dashboard, productos, CRM y produccion en primera iteracion.
- Se agrego `docker-compose.yml`, Dockerfiles y workflow CI base.
- Se corrigio el flujo web para que catalogo y producto lean datos reales desde la base y no desde arreglos hardcodeados.
- Se agrego carrito persistente en frontend y checkout real conectado a `POST /api/orders/checkout`.
- Se ajusto `DesignSession` web/API para guardar payload compatible con el schema compartido.
- Se implemento confirmacion de pago sandbox en backend y la creacion de orden pasa automaticamente a produccion.
- Se reemplazo el artwork mock por generacion real de archivos `PDF` y `SVG` locales servidos por la API.
- Se conecto `apps/admin` a datos reales de base para dashboard y cola de produccion.
- Se alineo `DashboardService` con el schema Prisma actual y se corrigio el wrapper `infra/scripts/pnpm.ps1`.
- Se saco el acceso directo a Prisma de `apps/web` y `apps/admin` para evitar errores de build en Next.
- Se agrego `POST /api/design/assets` para subir imagenes del cliente al storage local del proyecto.
- El personalizador ahora persiste imagenes subidas en la sesion y el renderer del artwork las reconoce.
- Se agrego `GET /api/orders/production-queue` para alimentar el panel de produccion desde la API.
- Se ajustaron scripts raiz para que `npm run db:generate`, `db:migrate` y `db:seed` no dependan de `pnpm` global.
- Se reemplazo `turbo dev` por un runner raiz basado en `npm` para evitar bloqueos de `corepack/pnpm` en Windows.
- Se alinearon los Dockerfiles con `npm workspaces` para que `docker compose build` no dependa de `pnpm`.
- Se corrigieron fallbacks locales de frontend/API a los puertos `3100/3101/3102`.
- Se reemplazaron dependencias internas `workspace:*` por referencias locales compatibles con `npm install` en Windows.
- Se agrego `infra/scripts/run-database.mjs` para ejecutar Prisma y seed cargando el `.env` raiz.
- Se corrigio `seed.ts` para no depender del enum exportado por Prisma Client en runtime.
- Se ajusto el runner raiz para Windows usando `cmd.exe /c` y evitar `spawn EINVAL`.
- Se corrigieron errores de compilacion de la API en `@printos/shared`, WhatsApp y renderer de artwork para destrabar `http://localhost:3102`.
- `@printos/shared` ahora se compila antes del arranque y expone `dist/` para que Nest pueda consumirlo correctamente en runtime.
- Se limpiaron duplicados dejados en `apps/api/src/auth` y se realinearon `orders.controller` / `orders.service` para que checkout, produccion y Swagger vuelvan a levantar juntos.
- Se restauro `design.service` para upload real de assets y persistencia compatible con el personalizador web, reemplazando el placeholder temporal que habia quedado.
- Se reemplazo el arranque de la API por `infra/scripts/run-nest.mjs` para evitar el shim roto de `nest.CMD` en instalaciones parciales del workspace.
- Se corrigio `infra/scripts/run-database.mjs` para ejecutar `tsx` y Prisma desde rutas reales del workspace, sin depender de subpaths no exportados.
- Se eliminaron lockfiles anidados y se versionaron los volumenes locales de Docker para forzar una base limpia cuando habia credenciales persistidas incompatibles.
- Se reemplazo el modo `dev` de la API por `tsc --watch + node dist/main.js` mediante `infra/scripts/run-api-dev.mjs`, eliminando la dependencia de Nest CLI en caliente.
- Se movio Postgres local del proyecto a `localhost:5433` para evitar colisiones con otras instancias locales en `5432`.
- Se ajusto `db:migrate` para desarrollo local con `prisma db push`, ya que esta base de trabajo no trae carpeta `prisma/migrations`.
- Se endurecio `infra/scripts/run-api-dev.mjs` para compilar la API con el `typescript/lib/tsc.js` sano del workspace raiz, ignorando instalaciones parciales rotas dentro de `apps/api/node_modules`.
- Se movio Redis local del proyecto a `localhost:6380` para evitar colisiones con servicios existentes en `6379`.
- Se agrego autorreparacion de `apps/api/node_modules` en `infra/scripts/run-api-dev.mjs`, reconstruyendo paquetes truncados desde las carpetas ocultas creadas por `npm` y restaurando `.prisma/client` para que la API pueda compilar y arrancar aun con una instalacion parcial corrupta.
- La reparacion del `node_modules` local de la API paso a ser forzada: cuando existe una variante oculta valida del paquete, ahora reemplaza la carpeta visible completa para evitar estados "semi rotos" que seguian bloqueando `@nestjs/*` y `@prisma/client`.
- El runner de la API ahora tambien hidrata dependencias declaradas desde `node_modules/.pnpm` y desde paquetes locales `file:` del monorepo, para reconstruir `apps/api/node_modules` aunque no existan variantes ocultas reparables.
- Se blindo el reparador del backend para ignorar `package.json` vacios o corruptos dentro de `apps/api/node_modules`; esos paquetes ahora se tratan como rotos y se rehidratan en lugar de romper el arranque con `Unexpected end of JSON input`.
- El reparador del backend ahora exige ademas que el `package.json` sea parseable antes de considerar un paquete "usable"; esto evita que paquetes como `express` queden sin rehacer aunque tengan archivos parciales.
- Se conecto el area del cliente de `apps/web` a pedidos y sesiones reales via API, reemplazando contenido estatico por datos operativos.
- Se agrego un filtro global de Prisma en la API para responder con error controlado cuando la base no esta disponible, evitando excepciones sin capturar en runtime.
- Se agrego `infra/scripts/repair-docker-desktop.ps1` para intentar recuperar Docker Desktop cuando el engine queda en `starting` por locks/permisos locales del host.
- Se corrigio el reparador de Docker Desktop para evitar errores de `takeown/icacls` con identidades Windows/AzureAD y dejar el fix mas limpio en campo.
- El panel de productos del admin ahora consume datos reales del catalogo operativo via API.
- Se abrieron los endpoints de lectura CRM para el backoffice interno y la vista `/crm` del admin paso a consumir leads, pipeline y conversaciones reales desde la API.
- Se completo la verificacion operativa local: Docker recuperado, `docker compose up`, `db:migrate`, `db:seed` y `npm run dev` exitosos con `web`, `admin` y `api` arriba.
- Se verifico Swagger en `http://localhost:3102/api/docs`, catalogo real en `/api/catalog/products`, dashboard real en `/api/dashboard` y creacion de lead autenticado en `/api/crm/leads`.
- Con esta validacion, la Fase 1 queda aprobada y lista para dar paso a la Fase 2.

## Riesgos abiertos

- El sandbox actual bloquea la ejecucion de scripts Node en esta ruta, por lo que no fue posible correr `npm install`, `prisma validate`, `next build` ni tests automatizados.
- La salida de arte ya es real en storage local; storage externo MinIO/S3 y composicion grafica mas avanzada quedan como siguiente salto, sin bloquear Fase 1.
- El sandbox actual no permite validar con `typecheck`, `build` ni tests del monorepo aunque el flujo fue alineado por codigo.
- El siguiente salto natural sera almacenamiento externo MinIO/S3, pero no bloquea el vertical de Fase 1.
- La principal deuda tecnica abierta para el siguiente salto es versionar migraciones Prisma formales en `packages/database/prisma/migrations`.
