[CmdletBinding()]
param(
  [int]$WaitSeconds = 180
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host "[docker-repair] $Message" -ForegroundColor Cyan
}

function Write-WarnMsg {
  param([string]$Message)
  Write-Host "[docker-repair] $Message" -ForegroundColor Yellow
}

function Write-Ok {
  param([string]$Message)
  Write-Host "[docker-repair] $Message" -ForegroundColor Green
}

function Test-IsAdmin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Stop-ProcessesByName {
  param([string[]]$Names)

  foreach ($name in $Names) {
    Get-Process -Name $name -ErrorAction SilentlyContinue | ForEach-Object {
      try {
        Stop-Process -Id $_.Id -Force -ErrorAction Stop
        Write-Step "Proceso detenido: $($_.ProcessName) ($($_.Id))"
      } catch {
        Write-WarnMsg "No se pudo detener $($_.ProcessName) ($($_.Id)): $($_.Exception.Message)"
      }
    }
  }
}

function Restart-ServiceIfPresent {
  param([string]$Name)

  $service = Get-Service -Name $Name -ErrorAction SilentlyContinue
  if (-not $service) {
    return
  }

  try {
    if ($service.Status -eq 'Running') {
      Restart-Service -Name $Name -Force -ErrorAction Stop
      Write-Step "Servicio reiniciado: $Name"
    } else {
      Start-Service -Name $Name -ErrorAction Stop
      Write-Step "Servicio iniciado: $Name"
    }
  } catch {
    Write-WarnMsg "No se pudo reiniciar/iniciar ${Name}: $($_.Exception.Message)"
  }
}

function Backup-PathIfExists {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }

  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $backup = "$Path.bak-$timestamp"
  Move-Item -LiteralPath $Path -Destination $backup -Force
  Write-Step "Respaldado: $Path -> $backup"
  return $backup
}

function Backup-DirectoryContents {
  param([string]$Directory)

  if (-not (Test-Path -LiteralPath $Directory)) {
    return
  }

  Get-ChildItem -LiteralPath $Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
    try {
      Backup-PathIfExists -Path $_.FullName | Out-Null
    } catch {
      Write-WarnMsg "No se pudo respaldar $($_.FullName): $($_.Exception.Message)"
    }
  }
}

function Repair-DockerConfigAcl {
  param([string]$DockerHome)

  if (-not (Test-Path -LiteralPath $DockerHome)) {
    return
  }

  Write-Step "Reparando permisos de $DockerHome"
  $currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent().Name

  $configPath = Join-Path $DockerHome 'config.json'
  if (-not (Test-Path -LiteralPath $configPath)) {
    return
  }

  try {
    $acl = Get-Acl -LiteralPath $configPath
    $inheritanceFlags = [System.Security.AccessControl.InheritanceFlags]::None
    $propagationFlags = [System.Security.AccessControl.PropagationFlags]::None
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
      $currentIdentity,
      [System.Security.AccessControl.FileSystemRights]::FullControl,
      $inheritanceFlags,
      $propagationFlags,
      [System.Security.AccessControl.AccessControlType]::Allow
    )
    $acl.SetAccessRule($accessRule)
    Set-Acl -LiteralPath $configPath -AclObject $acl
  } catch {
    Write-WarnMsg "No se pudo ajustar ACL sobre ${configPath}: $($_.Exception.Message)"
  }

  try {
    $raw = Get-Content -LiteralPath $configPath -Raw -ErrorAction Stop
    if ([string]::IsNullOrWhiteSpace($raw)) {
      Backup-PathIfExists -Path $configPath | Out-Null
      '{}' | Set-Content -LiteralPath $configPath -Encoding utf8
      Write-Step "config.json estaba vacio y fue recreado"
      return
    }

    $null = $raw | ConvertFrom-Json -ErrorAction Stop
    Write-Step "config.json es legible"
  } catch {
    Backup-PathIfExists -Path $configPath | Out-Null
    '{}' | Set-Content -LiteralPath $configPath -Encoding utf8
    Write-Step "config.json corrupto o inaccesible; se recreo uno limpio"
  }
}

function Wait-ForDockerInfo {
  param([int]$TimeoutSeconds)

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $output = & docker info 2>&1
      if ($LASTEXITCODE -eq 0 -and ($output -join "`n") -match 'Server:') {
        Write-Ok "Docker Engine responde correctamente"
        return $true
      }
    } catch {
    }

    Start-Sleep -Seconds 3
  }

  return $false
}

if (-not (Test-IsAdmin)) {
  throw "Ejecuta este script en PowerShell como Administrador."
}

$dockerDesktopExe = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
$dockerLocal = Join-Path $env:LOCALAPPDATA 'Docker'
$dockerHome = Join-Path $env:USERPROFILE '.docker'
$dockerLogs = Join-Path $dockerLocal 'log\host'
$backendLock = Join-Path $dockerLocal 'backend.lock'
$runDir = Join-Path $dockerLocal 'run'

Write-Step 'Cerrando Docker Desktop y procesos relacionados'
Stop-ProcessesByName -Names @(
  'Docker Desktop',
  'com.docker.backend',
  'com.docker.build',
  'com.docker.proxy',
  'com.docker.vpnkit',
  'dockerd'
)

Write-Step 'Apagando WSL'
try {
  & wsl.exe --shutdown
} catch {
  Write-WarnMsg "No se pudo ejecutar wsl --shutdown: $($_.Exception.Message)"
}

Write-Step 'Reiniciando servicios base'
Restart-ServiceIfPresent -Name 'WSLService'
Restart-ServiceIfPresent -Name 'vmcompute'
Restart-ServiceIfPresent -Name 'hns'
Restart-ServiceIfPresent -Name 'com.docker.service'

Write-Step 'Reparando permisos de ~/.docker'
try {
  Repair-DockerConfigAcl -DockerHome $dockerHome
} catch {
  Write-WarnMsg "No se pudo reparar ~/.docker: $($_.Exception.Message)"
}

if (Test-Path -LiteralPath $backendLock) {
  try {
    Remove-Item -LiteralPath $backendLock -Force
    Write-Step 'backend.lock eliminado'
  } catch {
    Write-WarnMsg "No se pudo eliminar backend.lock: $($_.Exception.Message)"
  }
}

Write-Step 'Respaldando logs host de Docker para liberar locks'
Backup-DirectoryContents -Directory $dockerLogs

if (Test-Path -LiteralPath $runDir) {
  Write-Step 'Respaldando contenido de run/'
  Backup-DirectoryContents -Directory $runDir
}

if (-not (Test-Path -LiteralPath $dockerDesktopExe)) {
  throw "No se encontro Docker Desktop en $dockerDesktopExe"
}

Write-Step 'Iniciando Docker Desktop'
Start-Process -FilePath $dockerDesktopExe | Out-Null

Write-Step "Esperando hasta $WaitSeconds segundos a que el engine responda"
if (Wait-ForDockerInfo -TimeoutSeconds $WaitSeconds) {
  Write-Ok 'Docker Desktop quedo operativo'
  exit 0
}

Write-WarnMsg 'Docker sigue sin responder despues del reinicio asistido.'
Write-WarnMsg 'Siguiente paso recomendado: Troubleshoot -> Clean / Purge data o reinstall, porque el engine no completa el init interno.'
exit 1
