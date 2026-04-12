param()

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$rootVercelDir = Join-Path $repoRoot ".vercel"
$rootProjectPath = Join-Path $rootVercelDir "project.json"
$backupProjectPath = Join-Path $rootVercelDir "project.web.json"
$apiProjectPath = Join-Path $repoRoot "apps\api\.vercel\project.json"

if (!(Test-Path $rootProjectPath)) {
  throw "[vercel] No existe .vercel/project.json en la raiz del repo."
}

if (!(Test-Path $apiProjectPath)) {
  throw "[vercel] No existe apps/api/.vercel/project.json. Ejecuta primero 'vercel link --cwd apps/api --yes --scope darwins-projects-052af53a --project subligo-api-app'."
}

Copy-Item $rootProjectPath $backupProjectPath -Force
Copy-Item $apiProjectPath $rootProjectPath -Force

try {
  Push-Location $repoRoot
  vercel --prod --force
  if ($LASTEXITCODE -ne 0) {
    throw "[vercel] Fallo el deploy productivo de la API."
  }
} finally {
  Pop-Location
  if (Test-Path $backupProjectPath) {
    Move-Item $backupProjectPath $rootProjectPath -Force
  }
}
