# PrintOS AI

Implementacion monorepo de PrintOS AI para SubliGo, basada en la especificacion maestra `PARA_CODEX_PEGAR_DIRECTAMENTE.md`.

## Estado actual

La Fase 1 queda aprobada operativamente. Este repositorio ya levanta con Docker, base semillada y los tres frentes activos (`web`, `admin`, `api`):

- Monorepo base `pnpm` + Turborepo, con wrappers `npm` para desarrollo local en Windows
- `apps/web`, `apps/admin`, `apps/api`
- `packages/database`, `packages/shared`, `packages/ui`, `packages/ai-agents`
- Documentacion viva en `docs/`
- Docker-first para entorno local

## Comandos objetivo

```powershell
Copy-Item .env.example .env
docker compose up -d postgres redis minio
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Inicio recomendado en Windows

El root ya no requiere `pnpm` global para levantar web, admin y API. Si quieres diagnosticar entorno o dejar `pnpm` disponible igual:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\scripts\bootstrap.ps1
```

Para validar solo la tienda web:

```powershell
npm install
npm run dev:web
```

Si Docker Desktop se queda en `Engine starting`, ejecuta este reparador en PowerShell como Administrador:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\scripts\repair-docker-desktop.ps1
```

El script hace un reset no destructivo del runtime local de Docker Desktop:

- cierra procesos colgados de Docker
- apaga WSL
- reinicia servicios base de Docker/WSL
- repara `~/.docker/config.json` si esta roto o inaccesible
- respalda locks, logs y archivos runtime que pueden dejar el engine colgado
- relanza Docker Desktop y espera a que `docker info` responda

## Puertos locales

Por defecto el proyecto usa:

- Web: `3100`
- Admin: `3101`
- API: `3102`

`npm run dev` y `docker compose up` ya respetan esos puertos desde `.env`.

Variables clave de esta fase:

- `NEXT_PUBLIC_API_URL=http://localhost:3102/api`
- `PUBLIC_API_BASE_URL=http://localhost:3102`

## Estructura

```text
apps/
  web/
  admin/
  api/
packages/
  database/
  shared/
  ui/
  ai-agents/
docs/
infra/
```

## Alcance de Fase 1

- Fundacion del monorepo
- Modelo de datos Prisma completo
- Backend API para auth, catalogo, CRM, pedidos y auditoria
- Frontend web y admin conectados a la API
- Pricing dual por unidad y por area
- Carrito persistente, checkout sandbox y cola de produccion real
- Upload de assets del cliente y generacion local de arte final
- Seeds, Docker y pruebas criticas
- Catalogo con lectura operativa en panel y consumo real desde la API
- CRM con leads, pipeline y conversaciones reales visibles desde el admin
