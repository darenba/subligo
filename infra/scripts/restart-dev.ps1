$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

Write-Host "[restart-dev] Repo: $repoRoot"
Write-Host "[restart-dev] Cerrando procesos del repo y listeners en 3100, 3101 y 3102"

$currentProcessId = $PID
$repoProcessMatchers = @(
  'infra\\scripts\\dev\.mjs',
  'infra\\scripts\\run-api-dev\.mjs',
  'infra\\scripts\\run-next\.mjs',
  'apps\\api\\dist\\main\.js',
  'apps\\api\\dist\\apps\\api\\src\\main\.js',
  'npm run dev',
  'next dev'
)

$repoProcesses = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object {
    $_.ProcessId -ne $currentProcessId -and
    $_.CommandLine -and
    $_.CommandLine -like "*$repoRoot*"
  }

function Stop-ProcessTree {
  param(
    [Parameter(Mandatory = $true)]
    [int]$ProcessId
  )

  try {
    & taskkill /PID $ProcessId /T /F | Out-Null
    Write-Host "[restart-dev] Proceso/árbol detenido: $ProcessId"
    return
  } catch {
    try {
      Stop-Process -Id $ProcessId -Force -ErrorAction Stop
      Write-Host "[restart-dev] Proceso detenido: $ProcessId"
    } catch {
      Write-Warning "[restart-dev] No se pudo detener el proceso $ProcessId"
    }
  }
}

function Wait-ForPortsReleased {
  param(
    [Parameter(Mandatory = $true)]
    [int[]]$Ports,
    [int]$TimeoutSeconds = 12
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    $listeners = Get-NetTCPConnection -LocalPort $Ports -State Listen -ErrorAction SilentlyContinue
    if (-not $listeners) {
      return
    }
    Start-Sleep -Milliseconds 300
  } while ((Get-Date) -lt $deadline)

  $remaining = Get-NetTCPConnection -LocalPort $Ports -State Listen -ErrorAction SilentlyContinue |
    Select-Object LocalPort, OwningProcess -Unique

  if ($remaining) {
    $remainingText = $remaining | ForEach-Object { "$($_.LocalPort):$($_.OwningProcess)" }
    Write-Warning "[restart-dev] Algunos puertos siguieron ocupados tras el reinicio limpio: $($remainingText -join ', ')"
  }
}

function Stop-PortListeners {
  param(
    [Parameter(Mandatory = $true)]
    [int[]]$Ports
  )

  $listenerProcessIds = Get-NetTCPConnection -LocalPort $Ports -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($listenerProcessId in $listenerProcessIds) {
    Stop-ProcessTree -ProcessId $listenerProcessId
  }
}

foreach ($repoProcess in $repoProcesses) {
  $commandLine = $repoProcess.CommandLine
  $matchesRepoCommand = $false

  foreach ($matcher in $repoProcessMatchers) {
    if ($commandLine -match $matcher) {
      $matchesRepoCommand = $true
      break
    }
  }

  if (-not $matchesRepoCommand) {
    continue
  }

  Stop-ProcessTree -ProcessId $repoProcess.ProcessId
}

$ports = 3100, 3101, 3102
Stop-PortListeners -Ports $ports

Wait-ForPortsReleased -Ports $ports
Start-Sleep -Milliseconds 500
Stop-PortListeners -Ports $ports
Wait-ForPortsReleased -Ports $ports

Write-Host "[restart-dev] Limpiando builds locales"
Remove-Item -Recurse -Force "$repoRoot\apps\admin\.next" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$repoRoot\apps\web\.next" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$repoRoot\apps\api\dist" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$repoRoot\apps\api\node_modules\.prisma" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$repoRoot\apps\admin\pages" -ErrorAction SilentlyContinue
Remove-Item -Force "$repoRoot\apps\api\.api-dev.lock" -ErrorAction SilentlyContinue

Write-Host "[restart-dev] Levantando entorno"
npm run dev
