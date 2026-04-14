param()

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$pushEnvScript = Join-Path $PSScriptRoot "push-api-env-to-vercel.ps1"
$deployScript = Join-Path $PSScriptRoot "deploy-api-vercel.ps1"

if (!(Test-Path $pushEnvScript)) {
  throw "[repair] No existe $pushEnvScript"
}

if (!(Test-Path $deployScript)) {
  throw "[repair] No existe $deployScript"
}

Push-Location $repoRoot

try {
  Write-Host "[repair] Sincronizando variables del API en Vercel..."
  & powershell -ExecutionPolicy Bypass -File $pushEnvScript
  if ($LASTEXITCODE -ne 0) {
    throw "[repair] Fallo la sincronizacion de variables del API."
  }

  Write-Host "[repair] Desplegando API y esperando healthcheck..."
  & powershell -ExecutionPolicy Bypass -File $deployScript
  if ($LASTEXITCODE -ne 0) {
    throw "[repair] Fallo el despliegue del API."
  }

  Write-Host "[repair] API lista."
  Write-Host "[repair] Health: https://subligo-api-app.vercel.app/api/health"
  Write-Host "[repair] Docs: https://subligo-api-app.vercel.app/api/docs"
} finally {
  Pop-Location
}
