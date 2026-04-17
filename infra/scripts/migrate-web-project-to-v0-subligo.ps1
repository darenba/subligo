param(
  [string]$SourceProjectName = "subligo-web-app",
  [string]$TargetProjectName = "v0-subligo",
  [string]$ProjectScope = "darwins-projects-052af53a",
  [string]$PrimaryDomain = "https://www.subligo.hn"
)

$ErrorActionPreference = "Stop"

function Resolve-VercelExecutable {
  $cmd = Get-Command vercel.cmd -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  $ps1 = Get-Command vercel -ErrorAction SilentlyContinue
  if ($ps1) { return $ps1.Source }

  $candidate = Join-Path $HOME "AppData\Roaming\npm\vercel.cmd"
  if (Test-Path $candidate) { return $candidate }

  return $null
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$pushEnvScript = Join-Path $PSScriptRoot "push-web-env-to-vercel.ps1"
$deployScript = Join-Path $PSScriptRoot "deploy-web-vercel.ps1"
$vercelExe = Resolve-VercelExecutable

if (-not $vercelExe) {
  throw "[vercel] No se encontro la CLI de Vercel."
}

if (!(Test-Path $pushEnvScript)) {
  throw "[migrate] No existe $pushEnvScript"
}

if (!(Test-Path $deployScript)) {
  throw "[migrate] No existe $deployScript"
}

Push-Location $repoRoot
try {
  Write-Host "[migrate] Migrando el web desde $SourceProjectName hacia $TargetProjectName..."
  Write-Host "[migrate] El proyecto destino se publicara en $PrimaryDomain y en https://$TargetProjectName.vercel.app"
  Write-Host "[migrate] Usando la sesion autenticada del CLI de Vercel para evitar el token vencido de la REST API."

  Write-Host "[migrate] Sincronizando variables de entorno del web en $TargetProjectName..."
  & powershell -ExecutionPolicy Bypass -File $pushEnvScript `
    -ProjectName $TargetProjectName `
    -ProjectScope $ProjectScope `
    -WebUrl $PrimaryDomain
  if ($LASTEXITCODE -ne 0) {
    throw "[migrate] Fallo la sincronizacion de variables del web."
  }

  Write-Host "[migrate] Construyendo y desplegando el web en $TargetProjectName..."
  & powershell -ExecutionPolicy Bypass -File $deployScript `
    -ProjectName $TargetProjectName `
    -ProjectScope $ProjectScope `
    -PrimaryUrl $PrimaryDomain
  if ($LASTEXITCODE -ne 0) {
    throw "[migrate] Fallo el deploy del web."
  }

  Write-Host "[migrate] Migracion completada."
  Write-Host "[migrate] Produccion: $PrimaryDomain"
  Write-Host "[migrate] Alias de Vercel: https://$TargetProjectName.vercel.app"
} finally {
  Pop-Location
}
