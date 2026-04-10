[CmdletBinding()]
param(
  [switch]$Seed,
  [switch]$SkipDev
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host "[up-all] $Message" -ForegroundColor Cyan
}

function Test-DockerHealthy {
  try {
    & docker info *> $null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

Write-Step "Repo: $repoRoot"

if (-not (Test-DockerHealthy)) {
  Write-Step "Docker no responde. Ejecutando reparacion asistida..."
  & "$PSScriptRoot\repair-docker-desktop.ps1"
}

Write-Step 'Levantando infraestructura base'
docker compose up -d postgres redis minio

Write-Step 'Generando cliente Prisma'
npm run db:generate

Write-Step 'Sincronizando base de datos'
npm run db:migrate

if ($Seed.IsPresent) {
  Write-Step 'Sembrando datos base'
  npm run db:seed
}

if (-not $SkipDev.IsPresent) {
  Write-Step 'Reiniciando aplicaciones'
  & "$PSScriptRoot\restart-dev.ps1"
} else {
  Write-Step 'Preparacion completada sin levantar apps (SkipDev)'
}
