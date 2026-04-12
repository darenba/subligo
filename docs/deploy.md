# Deploy y plataforma

## Resumen ejecutivo

- El repositorio es un monorepo `pnpm` + `turbo` con:
  - `apps/web`: Next.js 14 publico
  - `apps/admin`: Next.js 14 interno
  - `apps/api`: NestJS 11 con Prisma
  - `packages/database`, `packages/shared`, `packages/ui`, `packages/ai-agents`
- `web`, `admin` y `api` pueden vivir en Vercel.
- La condicion para que `api` funcione bien en Vercel es sacar las escrituras de `storage/` a Supabase Storage.
- Arquitectura recomendada:
  - `apps/web` en Vercel
  - `apps/admin` en Vercel
  - `apps/api` en Vercel
  - Postgres en Supabase
  - Supabase Storage para uploads, artes y overrides
  - Redis externo solo si una segunda fase realmente lo necesita

## Estado actual

- Admin desplegado correctamente:
  - `https://subligo-admin-app.vercel.app/admin`
- Web desplegada correctamente:
  - `https://subligo-web-app.vercel.app`
- La API productiva aun no existe; por eso `web` y `admin` pueden renderizar, pero no tienen datos reales en nube.
- La API ya esta preparada para usar Supabase Storage y dejar de depender de `storage/` local cuando se definan:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_PUBLIC_BUCKET`
  - `SUPABASE_PRIVATE_BUCKET`
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
docker exec printos-postgres pg_dump -U printos -d printos_ai --no-owner --no-privileges > subligo-supabase-import.sql
```

O usando el script del repo:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\scripts\export-db-for-supabase.ps1
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

API:

```powershell
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
vercel link --yes --cwd apps/api --scope darwins-projects-052af53a --project subligo-api-app
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

API:

```powershell
vercel inspect https://subligo-api-app.vercel.app --logs
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

API:

```powershell
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
vercel link --yes --cwd apps/api --scope darwins-projects-052af53a --project subligo-api-app
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

API:

```powershell
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
vercel link --yes --cwd apps/api --scope darwins-projects-052af53a --project subligo-api-app
powershell -ExecutionPolicy Bypass -File .\infra\scripts\deploy-api-vercel.ps1
```

O usando el script del repo para evitar conflictos con el link de `web`:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\scripts\deploy-api-vercel.ps1
```

Admin:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\scripts\deploy-admin-vercel.ps1
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

### API en Vercel

```text
DATABASE_URL=...
DIRECT_URL=...
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_PUBLIC_BUCKET=printos-public
SUPABASE_PRIVATE_BUCKET=printos-private
PUBLIC_API_BASE_URL=https://subligo-api-app.vercel.app
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

## Ruta recomendada para Vercel + Supabase

### Arquitectura minima viable

- `apps/web` en Vercel
- `apps/admin` en Vercel
- `apps/api` en Vercel
- Postgres en Supabase
- Supabase Storage para `uploads/`, `artworks/` y overrides de prompts

### Por que ya no dependemos de `storage/` local

- `apps/api/src/design/design.service.ts` ahora sube assets a Supabase Storage cuando existen `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
- `apps/api/src/orders/artwork-renderer.ts` ahora genera PDF/SVG y los sube a Supabase Storage
- `apps/api/src/agents/agent-prompt-store.ts` ahora guarda overrides en un bucket privado de Supabase Storage
- `apps/api/src/main.ts` solo sirve `/files` cuando estas variables no existen, para mantener compatibilidad local

Eso permite dos modos validos:

- desarrollo local con Docker y `storage/`
- produccion en Vercel sin filesystem persistente

### Ajustes de codigo ya aplicados para Vercel + Supabase

- `apps/api/src/main.ts`
  - ahora respeta `PORT`
  - expone `GET /api/health`
  - permite CORS desde `NEXT_PUBLIC_WEB_URL` y `NEXT_PUBLIC_ADMIN_URL`
  - deja de montar `/files` cuando usa Supabase Storage
- `apps/api/src/common/object-storage.ts`
  - crea buckets en Supabase si faltan
  - sube archivos publicos
  - lee y escribe JSON privado
- `apps/api/vercel.json`
  - instala el slice correcto del monorepo para Vercel

### Pasos operativos en Vercel

1. Crear o linkear un proyecto `subligo-api-app` con root directory `apps/api`.
2. Ejecutar `infra/sql/supabase-prisma-role.sql` en Supabase.
3. Importar `subligo-supabase-import.sql` usando el host real de Supabase.
4. Definir variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_PUBLIC_BUCKET`
   - `SUPABASE_PRIVATE_BUCKET`
   - `PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_WEB_URL`
   - `NEXT_PUBLIC_ADMIN_URL`
   - `JWT_SECRET`
   - `STRIPE_SECRET_KEY` si activaras cobros Stripe en esta fase
   - `STRIPE_WEBHOOK_SECRET` si activaras webhooks Stripe
   - `WHATSAPP_VERIFY_TOKEN` si activaras el webhook de WhatsApp
   - `WHATSAPP_APP_SECRET` si activaras integracion Meta/WhatsApp
   - `WHATSAPP_ACCESS_TOKEN` si activaras integracion Meta/WhatsApp
   - `OPENAI_API_KEY` si activaras agentes AI en produccion
5. Validar:
   - `https://TU_API/api/health`
   - `https://TU_API/api/docs`
6. Actualizar Vercel:
   - `NEXT_PUBLIC_API_URL=https://TU_API/api`
   - `PUBLIC_API_BASE_URL=https://TU_API`

### Importar el dump a Postgres remoto sin instalar `psql`

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\scripts\import-db-to-postgres.ps1 -ConnectionString "postgresql://prisma:TU_PASSWORD@TU_HOST:5432/postgres?sslmode=require"
```

### Opcion de base de datos

#### Opcion recomendada: Supabase Postgres

- Encaja bien con Prisma usando:
  - `DATABASE_URL` para el pooler
  - `DIRECT_URL` para conexiones directas y migraciones
- El repo incluye `infra/sql/supabase-prisma-role.sql` para crear el usuario `prisma` con permisos adecuados antes de conectar la app.

## MCPs

### Ya configurados

- `supabase` en `.mcp.json`
- `github` en `.mcp.json` usando el endpoint remoto oficial de GitHub MCP
- `vercel` en `.mcp.json`

### Pendientes

- Filesystem MCP: no hace falta porque el cliente actual ya opera sobre el repo local.

## Pendientes operativos

1. Dar acceso del GitHub App de Vercel al repo `darenba/subligo`.
2. Desplegar `apps/api` en Vercel y publicar `PUBLIC_API_BASE_URL`.
3. Conectar `web` y `admin` a la API productiva mediante `NEXT_PUBLIC_API_URL`.
4. Migrar la DB local Docker a una DB publica de produccion.
5. Cargar credenciales reales de Supabase para activar Storage remoto.

## Nota sobre la limitacion del agente

En este entorno de agente, cualquier comando Node real sobre el perfil del usuario cae con:

```text
EPERM: operation not permitted, lstat 'C:\Users\darwinbarahona'
```

Eso bloquea ejecutar `pnpm`, `vercel inspect` o scripts Node desde aqui aunque el repo sea legible y editable. Por eso las validaciones de build y deploy se dejaron apoyadas en:

- lectura directa del repo
- logs reales de Vercel que corriste en tu PowerShell local
- cambios concretos ya aplicados al codigo y configuracion
