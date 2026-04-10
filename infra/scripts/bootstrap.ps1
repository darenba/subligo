$ErrorActionPreference = 'Stop'

function Get-EnvFileValue {
  param(
    [string]$Key,
    [string]$DefaultValue
  )

  if (-not (Test-Path '.env')) {
    return $DefaultValue
  }

  $match = Get-Content '.env' | Where-Object { $_ -match "^$Key=" } | Select-Object -First 1
  if (-not $match) {
    return $DefaultValue
  }

  return ($match -split '=', 2)[1]
}

function Show-PortWarning {
  param(
    [int]$Port,
    [string]$Label
  )

  $connections = cmd /c "netstat -ano | findstr LISTENING | findstr :$Port"
  if (-not $connections) {
    return
  }

  $pids = $connections | ForEach-Object {
    (($_ -replace '^\s+', '') -split '\s+')[-1]
  } | Sort-Object -Unique
  $processes = Get-Process -Id $pids -ErrorAction SilentlyContinue | Select-Object Id, ProcessName
  Write-Warning "$Label usa el puerto $Port, pero ya esta ocupado."
  if ($processes) {
    $processes | ForEach-Object {
      Write-Warning "Puerto $Port ocupado por PID $($_.Id) ($($_.ProcessName))"
    }
  }
}

if (-not (Test-Path '.env')) {
  Write-Host 'Creando .env desde .env.example...'
  Copy-Item '.env.example' '.env'
}

$webPort = [int](Get-EnvFileValue -Key 'WEB_PORT' -DefaultValue '3000')
$adminPort = [int](Get-EnvFileValue -Key 'ADMIN_PORT' -DefaultValue '3001')
$apiHostPort = [int](Get-EnvFileValue -Key 'API_HOST_PORT' -DefaultValue '3002')

Show-PortWarning -Port $webPort -Label 'apps/web'
Show-PortWarning -Port $adminPort -Label 'apps/admin'
Show-PortWarning -Port $apiHostPort -Label 'apps/api'

$pnpmWrapper = Join-Path $PSScriptRoot 'pnpm.ps1'

Write-Host 'Instalando dependencias...'
& $pnpmWrapper install

Write-Host 'Levantando infraestructura...'
docker compose up -d postgres redis minio

Write-Host 'Ejecutando migraciones y seeds...'
& $pnpmWrapper db:migrate
& $pnpmWrapper db:seed

Write-Host 'Entorno base listo.'
