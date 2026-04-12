param()

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$rootVercelDir = Join-Path $repoRoot ".vercel"
$rootProjectPath = Join-Path $rootVercelDir "project.json"
$backupProjectPath = Join-Path $rootVercelDir "project.web.json"
$adminProjectPath = Join-Path $repoRoot "apps\admin\.vercel\project.json"

if (!(Test-Path $rootProjectPath)) {
  throw "[vercel] No existe .vercel/project.json en la raiz del repo."
}

if (!(Test-Path $adminProjectPath)) {
  throw "[vercel] No existe apps/admin/.vercel/project.json. Ejecuta primero 'vercel link --cwd apps/admin --yes --scope darwins-projects-052af53a --project subligo-admin-app'."
}

Copy-Item $rootProjectPath $backupProjectPath -Force
Copy-Item $adminProjectPath $rootProjectPath -Force

try {
  Push-Location $repoRoot
  vercel --prod
  if ($LASTEXITCODE -ne 0) {
    throw "[vercel] Fallo el deploy productivo del admin."
  }
} finally {
  Pop-Location
  if (Test-Path $backupProjectPath) {
    Move-Item $backupProjectPath $rootProjectPath -Force
  }
}
