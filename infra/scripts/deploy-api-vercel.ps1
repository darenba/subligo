param()

function Resolve-VercelExecutable {
  $cmd = Get-Command vercel.cmd -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  $ps1 = Get-Command vercel -ErrorAction SilentlyContinue
  if ($ps1) { return $ps1.Source }

  $candidate = Join-Path $HOME "AppData\Roaming\npm\vercel.cmd"
  if (Test-Path $candidate) { return $candidate }

  return $null
}

function Get-FirstRegexMatch {
  param(
    [Parameter(Mandatory = $true)][string[]]$Lines,
    [Parameter(Mandatory = $true)][string]$Pattern
  )

  foreach ($line in $Lines) {
    if ($line -match $Pattern) {
      return $Matches[1]
    }
  }

  return $null
}

function Wait-ForApiHealth {
  param(
    [Parameter(Mandatory = $true)][string[]]$BaseUrls,
    [int]$Attempts = 180,
    [int]$DelaySeconds = 10
  )

  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    foreach ($baseUrl in $BaseUrls) {
      $healthUrl = ($baseUrl.TrimEnd('/') + "/api/health")

      try {
        $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 20
        if ($response.ok -eq $true) {
          Write-Host "[vercel] API saludable en $healthUrl"
          return $true
        }
      } catch {
      }
    }

    Write-Host "[vercel] Esperando healthcheck de la API ($attempt/$Attempts)..."

    if ($attempt -lt $Attempts) {
      Start-Sleep -Seconds $DelaySeconds
    }
  }

  return $false
}

function Use-VercelProjectLink {
  param(
    [Parameter(Mandatory = $true)][string]$RepoRoot,
    [Parameter(Mandatory = $true)][string]$LinkedProjectPath,
    [Parameter(Mandatory = $true)][scriptblock]$Action
  )

  $rootVercelDir = Join-Path $RepoRoot ".vercel"
  $rootProjectPath = Join-Path $rootVercelDir "project.json"
  $rootReadmePath = Join-Path $rootVercelDir "README.txt"
  $rootProjectBackup = $null
  $rootReadmeBackup = $null

  if (!(Test-Path $rootVercelDir)) {
    New-Item -ItemType Directory -Path $rootVercelDir | Out-Null
  }

  if (Test-Path $rootProjectPath) {
    $rootProjectBackup = Get-Content $rootProjectPath -Raw
  }

  if (Test-Path $rootReadmePath) {
    $rootReadmeBackup = Get-Content $rootReadmePath -Raw
  }

  Copy-Item -LiteralPath $LinkedProjectPath -Destination $rootProjectPath -Force

  $linkedReadmePath = Join-Path (Split-Path $LinkedProjectPath -Parent) "README.txt"
  if (Test-Path $linkedReadmePath) {
    Copy-Item -LiteralPath $linkedReadmePath -Destination $rootReadmePath -Force
  }

  try {
    & $Action
  } finally {
    if ($null -ne $rootProjectBackup) {
      Set-Content -LiteralPath $rootProjectPath -Value $rootProjectBackup
    } elseif (Test-Path $rootProjectPath) {
      Remove-Item -LiteralPath $rootProjectPath -Force
    }

    if ($null -ne $rootReadmeBackup) {
      Set-Content -LiteralPath $rootReadmePath -Value $rootReadmeBackup
    } elseif (Test-Path $rootReadmePath) {
      Remove-Item -LiteralPath $rootReadmePath -Force
    }
  }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$apiDir = Join-Path $repoRoot "apps\api"
$apiProjectPath = Join-Path $repoRoot "apps\api\.vercel\project.json"
$vercelExe = Resolve-VercelExecutable

if (!(Test-Path $apiProjectPath)) {
  throw "[vercel] No existe apps/api/.vercel/project.json. Ejecuta primero 'vercel link --cwd apps/api --yes --scope darwins-projects-052af53a --project subligo-api-app'."
}

if (!(Test-Path $apiDir)) {
  throw "[vercel] No existe el directorio apps/api."
}

if (-not $vercelExe) {
  throw "[vercel] No se encontro la CLI de Vercel."
}

try {
  Push-Location $repoRoot

  $deployLines = @()
  $deployExitCode = 1

  Use-VercelProjectLink -RepoRoot $repoRoot -LinkedProjectPath $apiProjectPath -Action {
    $script:deployOutput = & $vercelExe --prod --force --yes --non-interactive 2>&1
    $script:deployExitCode = $LASTEXITCODE
    $script:deployLines = @($script:deployOutput | ForEach-Object { "$_" })
  }

  foreach ($line in $deployLines) {
    Write-Host $line
  }

  $inspectUrl = Get-FirstRegexMatch -Lines $deployLines -Pattern 'Inspect:\s+(https://\S+)'
  $productionUrl = Get-FirstRegexMatch -Lines $deployLines -Pattern 'Production:\s+(https://\S+)'
  $apiProject = Get-Content $apiProjectPath | ConvertFrom-Json
  $stableAliasUrl = "https://$($apiProject.projectName).vercel.app"

  if (-not $productionUrl) {
    Write-Host "[vercel] La CLI no devolvio una URL temporal; se intentara validar el alias estable."
  }

  if ($productionUrl) {
    Write-Host "[vercel] URL de produccion detectada: $productionUrl"
  }
  Write-Host "[vercel] Alias estable esperado: $stableAliasUrl"
  if ($inspectUrl) {
    Write-Host "[vercel] Inspeccion disponible en: $inspectUrl"
  }

  $healthTargets = @($productionUrl, $stableAliasUrl) | Where-Object { $_ } | Select-Object -Unique
  if (Wait-ForApiHealth -BaseUrls $healthTargets) {
    return
  }

  if ($deployExitCode -ne 0) {
    throw "[vercel] La CLI reporto error y la API no respondio en /api/health. Revisa el deploy en $inspectUrl o prueba el alias $stableAliasUrl"
  }

  throw "[vercel] El deploy termino sin error, pero la API no respondio en ninguno de estos endpoints: $($healthTargets -join ', ')"
} finally {
  Pop-Location
}
