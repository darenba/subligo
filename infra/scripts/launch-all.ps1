[CmdletBinding()]
param(
  [switch]$Seed,
  [switch]$NewWindow
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

Write-Host "[launch-all] Repo: $repoRoot" -ForegroundColor Cyan
Write-Host "[launch-all] Preparando infraestructura y datos..." -ForegroundColor Cyan

$upArgs = @(
  '-ExecutionPolicy', 'Bypass',
  '-File', (Join-Path $PSScriptRoot 'up-all.ps1'),
  '-SkipDev'
)

if ($Seed.IsPresent) {
  $upArgs += '-Seed'
}

& powershell @upArgs

if ($NewWindow.IsPresent) {
  Write-Host "[launch-all] Abriendo ventana dedicada para el entorno dev" -ForegroundColor Cyan

  $command = @"
Set-Location '$repoRoot'
Write-Host '[launch-all] Reinicio limpio de web, admin y api' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File '$PSScriptRoot\restart-dev.ps1'
"@

  Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-ExecutionPolicy', 'Bypass',
    '-Command', $command
  ) | Out-Null

  Write-Host "[launch-all] Ventana iniciada. Abre http://localhost:3100, http://localhost:3101/agentes y http://localhost:3102/api/docs" -ForegroundColor Green
  exit 0
}

Write-Host "[launch-all] Levantando entorno dev en esta misma consola" -ForegroundColor Cyan
& (Join-Path $PSScriptRoot 'restart-dev.ps1')
