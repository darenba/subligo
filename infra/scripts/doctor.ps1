$ErrorActionPreference = 'Stop'

function Show-CommandStatus {
  param(
    [string]$CommandName
  )

  $command = Get-Command $CommandName -ErrorAction SilentlyContinue
  if ($command) {
    Write-Host "[OK] $CommandName -> $($command.Source)"
    return
  }

  Write-Warning "[MISSING] $CommandName no esta disponible en PATH"
}

function Show-PortStatus {
  param(
    [int]$Port
  )

  $connections = cmd /c "netstat -ano | findstr LISTENING | findstr :$Port"
  if (-not $connections) {
    Write-Host "[FREE] Puerto $Port"
    return
  }

  $pids = $connections | ForEach-Object {
    (($_ -replace '^\s+', '') -split '\s+')[-1]
  } | Sort-Object -Unique
  $processes = Get-Process -Id $pids -ErrorAction SilentlyContinue | Select-Object Id, ProcessName

  foreach ($process in $processes) {
    Write-Warning "[USED] Puerto $Port -> PID $($process.Id) ($($process.ProcessName))"
  }
}

Show-CommandStatus -CommandName 'corepack.cmd'
Show-CommandStatus -CommandName 'pnpm.cmd'
Show-CommandStatus -CommandName 'npm.cmd'
Show-CommandStatus -CommandName 'docker'

Show-PortStatus -Port 3000
Show-PortStatus -Port 3001
Show-PortStatus -Port 3002
Show-PortStatus -Port 3100
Show-PortStatus -Port 3101
Show-PortStatus -Port 3102
