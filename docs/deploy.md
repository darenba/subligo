# Deploy y plataforma

## Resumen ejecutivo

- El repositorio es un monorepo `pnpm` + `turbo` con:
  - `apps/web`: Next.js 14 publico
  - `apps/admin`: Next.js 14 interno
  - `apps/api`: NestJS 11 con Prisma
  - `packages/database`, `packages/shared`, `packages/ui`, `packages/ai-agents`
- `web` y `admin` si son candidatos naturales para Vercel.
- `api` no debe desplegarse en Vercel en su estado actual porque usa filesystem persistente:
  - `apps/api/src/main.ts` sirve `storage/`
  - `apps/api/src/design/design.service.ts` escribe uploads en `storage/uploads`
  - `apps/api/src/orders/artwork-renderer.ts` escribe artes en `storage/artworks`
  - `apps/api/src/agents/agent-prompt-store.ts` persiste overrides en `storage/`
- Arquitectura recomendada:
  - `apps/web` en Vercel
  - `apps/admin` en Vercel
  - `apps/api` en un host Node persistente
  - Postgres en Supabase
  - Storage en S3/R2/MinIO externo
  - Redis externo si se usa en produccion

## Estado actual

- Admin desplegado correctamente:
  - `https://subligo-admin-app.vercel.app/admin`
- Web desplegada correctamente:
  - `https://subligo-web-app.vercel.app`
- La API productiva aun no existe; por eso `web` y `admin` pueden renderizar, pero no tienen datos reales en nube.
- La base de datos real del sistema hoy sigue local en Docker:
  - contenedor: `printos-postgres`
  - base: `printos_ai`
  - volumen: `subligo_printos_postgres_data_v2`
- GitHub push funcionando a:
  - `https://github.com/darenba/subligo.git`
- Vercel no tiene auto-deploy por GitHub todavia porque la app de Vercel no tiene acceso al repo.

## Configuracion Vercel aplicada

### Admin

- `apps/admin/vercel.json`
- `apps/admin/next.config.mjs`

La estrategia actual instala solo el slice del monorepo necesario y ejecuta el build desde la raiz del repo.

### Web

- `apps/web/vercel.json`
- `apps/web/next.config.mjs`

Tambien se dejo el rewrite opcional de `/admin` hacia `ADMIN_UPSTREAM_URL`.

## Riesgos reales

### Riesgos de despliegue

- `apps/api` depende de disco local persistente.
- El API actual escribe directo a `storage/`; hoy no usa MinIO/S3 como backend runtime.
- El repo usa Docker para el entorno local completo.
- `.env.example` declara Postgres, Redis, MinIO, Stripe, WhatsApp y OpenAI.
- La integracion GitHub -> Vercel falla hoy por permisos del GitHub App de Vercel sobre `darenba/subligo`.

### Riesgos de CI

- El root usa `eslint@9`, mientras `apps/web` y `apps/admin` siguen con `next lint` sobre Next 14.
- Ya hubo evidencia de incompatibilidad de lint durante `next build` en Vercel.
- Por eso Vercel se configuro para saltar lint en build; CI puede seguir necesitando alineacion adicional.

## Comandos exactos

### 1. Instalacion previa

```powershell
nvm install 20.19.0
nvm use 20.19.0
corepack enable
npm i -g vercel
```

Opcional para inspeccion de GitHub Actions:

```powershell
winget install --id GitHub.cli
gh auth login
```

### 2. Dependencias

```powershell
Copy-Item .env.example .env
pnpm install --no-frozen-lockfile
```

### 3. Servicios locales

```powershell
docker compose up -d postgres redis minio
pnpm db:migrate
pnpm db:seed
```

### 4. Levantar local

```powershell
pnpm dev
```

Solo web:

```powershell
pnpm dev:web
```

Solo admin:

```powershell
pnpm dev:admin
```

Solo API:

```powershell
pnpm dev:api
```

### 5. Reproducir build local

```powershell
pnpm build:web
pnpm build:admin
pnpm build:api
```

Typecheck por app:

```powershell
pnpm typecheck:web
pnpm typecheck:admin
pnpm typecheck:api
```

### 5.1 Verificar la base de datos local

```powershell
docker compose up -d postgres
docker exec printos-postgres psql -U printos -d printos_ai -P pager=off -c "\dt"
docker exec printos-postgres psql -U printos -d printos_ai -P pager=off -c "select count(*) as users from users;"
docker exec printos-postgres psql -U printos -d printos_ai -P pager=off -c "select count(*) as products from products;"
docker exec printos-postgres psql -U printos -d printos_ai -P pager=off -c "select count(*) as orders from orders;"
docker volume inspect subligo_printos_postgres_data_v2
```

Backup local antes de migrar la base:

```powershell
docker exec printos-postgres pg_dump -U printos -d printos_ai > subligo-local-backup.sql
```

### 6. Reproducir build Vercel localmente

Web:

```powershell
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
vercel link --yes --scope darwins-projects-052af53a --project subligo-web-app
vercel build
```

Admin:

```powershell
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
vercel link --yes --scope darwins-projects-052af53a --project subligo-admin-app
vercel build
```

### 7. Inspeccionar deployments y logs

Web:

```powershell
vercel inspect https://subligo-web-app.vercel.app --logs
```

Admin:

```powershell
vercel inspect https://subligo-admin-app.vercel.app --logs
```

Deployment puntual:

```powershell
vercel inspect <deployment-url> --logs
```

### 8. Deploy preview

Web:

```powershell
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
vercel link --yes --scope darwins-projects-052af53a --project subligo-web-app
vercel
```

Admin:

```powershell
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
vercel link --yes --scope darwins-projects-052af53a --project subligo-admin-app
vercel
```

### 9. Deploy produccion

Web:

```powershell
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
vercel link --yes --scope darwins-projects-052af53a --project subligo-web-app
vercel --prod
```

Admin:

```powershell
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
vercel link --yes --scope darwins-projects-052af53a --project subligo-admin-app
vercel --prod
```

### 10. GitHub Actions

Ver workflows:

```powershell
gh workflow list
gh run list --limit 10
gh run view <run-id> --log
```

### 11. MCPs

Ver MCPs remotos configurados en el repo:

```powershell
Get-Content .mcp.json
```

Probar Vercel MCP con Codex CLI:

```powershell
codex mcp add vercel --url https://mcp.vercel.com
codex
```

Probar GitHub MCP local con Docker:

```powershell
$env:GITHUB_PERSONAL_ACCESS_TOKEN='TU_TOKEN'
docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server
```

## Variables de entorno de produccion

### Web en Vercel

```text
NEXT_PUBLIC_API_URL=https://TU_API_PUBLICA/api
NEXT_PUBLIC_WEB_URL=https://www.subligo.hn
NEXT_PUBLIC_ADMIN_URL=https://www.subligo.hn/admin
NEXT_PUBLIC_APP_NAME=SubliGo
NEXT_PUBLIC_DEFAULT_CURRENCY=HNL
ADMIN_UPSTREAM_URL=https://subligo-admin-app.vercel.app
```

### Admin en Vercel

```text
NEXT_PUBLIC_BASE_PATH=/admin
NEXT_PUBLIC_API_URL=https://TU_API_PUBLICA/api
PUBLIC_API_BASE_URL=https://TU_API_PUBLICA
NEXT_PUBLIC_ADMIN_URL=https://www.subligo.hn/admin
```

### API fuera de Vercel

```text
PORT=8080
DATABASE_URL=...
DIRECT_URL=...
PUBLIC_API_BASE_URL=https://api.subligo.hn
NEXT_PUBLIC_WEB_URL=https://www.subligo.hn
NEXT_PUBLIC_ADMIN_URL=https://www.subligo.hn/admin
JWT_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
WHATSAPP_VERIFY_TOKEN=...
WHATSAPP_APP_SECRET=...
WHATSAPP_ACCESS_TOKEN=...
OPENAI_API_KEY=...
```

## Ruta recomendada para Railway

### Arquitectura minima viable

- `apps/web` en Vercel
- `apps/admin` en Vercel
- `apps/api` en Railway
- Postgres en Supabase o Railway Postgres
- volumen persistente en Railway montado en `/app/storage`

### Por que `/app/storage`

- `infra/docker/Dockerfile.api` usa `WORKDIR /app`
- `apps/api/src/main.ts` sirve `join(process.cwd(), 'storage')`
- `apps/api/src/design/design.service.ts` guarda uploads en `storage/uploads`
- `apps/api/src/orders/artwork-renderer.ts` guarda artes en `storage/artworks`
- `apps/api/src/agents/agent-prompt-store.ts` guarda overrides en `storage/`

Eso permite un despliegue inicial en Railway sin reescribir todavia la capa de archivos, siempre que el servicio tenga un volumen persistente en `/app/storage`.

### Ajustes de codigo ya aplicados para Railway

- `apps/api/src/main.ts`
  - ahora respeta `PORT`
  - expone `GET /api/health`
  - permite CORS desde `NEXT_PUBLIC_WEB_URL` y `NEXT_PUBLIC_ADMIN_URL`

### Pasos operativos en Railway

1. Crear un proyecto nuevo.
2. Crear un servicio para `apps/api`.
3. Configurar build desde `infra/docker/Dockerfile.api`.
4. Adjuntar un volumen persistente montado en `/app/storage`.
5. Definir variables:
   - `PORT`
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_WEB_URL`
   - `NEXT_PUBLIC_ADMIN_URL`
   - `JWT_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `WHATSAPP_VERIFY_TOKEN`
   - `WHATSAPP_APP_SECRET`
   - `WHATSAPP_ACCESS_TOKEN`
   - `OPENAI_API_KEY`
6. Validar:
   - `https://TU_API/api/health`
   - `https://TU_API/api/docs`
7. Actualizar Vercel:
   - `NEXT_PUBLIC_API_URL=https://TU_API/api`
   - `PUBLIC_API_BASE_URL=https://TU_API`

### Opcion de base de datos

#### Opcion recomendada: Supabase Postgres

- Encaja bien con Prisma usando:
  - `DATABASE_URL` para el pooler
  - `DIRECT_URL` para conexiones directas y migraciones

#### Opcion mas simple: Railway Postgres

- Menos piezas al principio.
- Mas facil si prefieres mover API y DB al mismo proveedor.

## MCPs

### Ya configurados

- `supabase` en `.mcp.json`
- `github` en `.mcp.json` usando el endpoint remoto oficial de GitHub MCP
- `vercel` en `.mcp.json`

### Pendientes

- Filesystem MCP: no hace falta porque el cliente actual ya opera sobre el repo local.

## Pendientes operativos

1. Dar acceso del GitHub App de Vercel al repo `darenba/subligo`.
2. Desplegar `apps/api` en Railway y publicar `PUBLIC_API_BASE_URL`.
3. Conectar `web` y `admin` a la API productiva mediante `NEXT_PUBLIC_API_URL`.
4. Migrar la DB local Docker a una DB publica de produccion.
5. Reemplazar `storage/` local por object storage real en una segunda fase o mantener volumen Railway como paso intermedio.

## Nota sobre la limitacion del agente

En este entorno de agente, cualquier comando Node real sobre el perfil del usuario cae con:

```text
EPERM: operation not permitted, lstat 'C:\Users\darwinbarahona'
```

Eso bloquea ejecutar `pnpm`, `vercel inspect` o scripts Node desde aqui aunque el repo sea legible y editable. Por eso las validaciones de build y deploy se dejaron apoyadas en:

- lectura directa del repo
- logs reales de Vercel que corriste en tu PowerShell local
- cambios concretos ya aplicados al codigo y configuracion
