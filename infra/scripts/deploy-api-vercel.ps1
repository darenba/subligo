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
    [Parameter(Mandatory = $true)][string]$BaseUrl,
    [int]$Attempts = 12,
    [int]$DelaySeconds = 10
  )

  $healthUrl = ($BaseUrl.TrimEnd('/') + "/api/health")

  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    try {
      $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 20
      if ($response.ok -eq $true) {
        Write-Host "[vercel] API saludable en $healthUrl"
        return $true
      }
    } catch {
      Write-Host "[vercel] Esperando healthcheck de la API ($attempt/$Attempts)..."
    }

    if ($attempt -lt $Attempts) {
      Start-Sleep -Seconds $DelaySeconds
    }
  }

  return $false
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$rootVercelDir = Join-Path $repoRoot ".vercel"
$rootProjectPath = Join-Path $rootVercelDir "project.json"
$backupProjectPath = Join-Path $rootVercelDir "project.web.json"
$apiProjectPath = Join-Path $repoRoot "apps\api\.vercel\project.json"
$vercelExe = Resolve-VercelExecutable

if (!(Test-Path $rootProjectPath)) {
  throw "[vercel] No existe .vercel/project.json en la raiz del repo."
}

if (!(Test-Path $apiProjectPath)) {
  throw "[vercel] No existe apps/api/.vercel/project.json. Ejecuta primero 'vercel link --cwd apps/api --yes --scope darwins-projects-052af53a --project subligo-api-app'."
}

if (-not $vercelExe) {
  throw "[vercel] No se encontro la CLI de Vercel."
}

Copy-Item $rootProjectPath $backupProjectPath -Force
Copy-Item $apiProjectPath $rootProjectPath -Force

try {
  Push-Location $repoRoot

  $deployOutput = & $vercelExe --prod --force --yes --non-interactive 2>&1
  $deployExitCode = $LASTEXITCODE
  $deployLines = @($deployOutput | ForEach-Object { "$_" })

  foreach ($line in $deployLines) {
    Write-Host $line
  }

  $inspectUrl = Get-FirstRegexMatch -Lines $deployLines -Pattern 'Inspect:\s+(https://\S+)'
  $productionUrl = Get-FirstRegexMatch -Lines $deployLines -Pattern 'Production:\s+(https://\S+)'

  if (-not $productionUrl) {
    throw "[vercel] La CLI no devolvio una URL de produccion para la API."
  }

  Write-Host "[vercel] URL de produccion detectada: $productionUrl"
  if ($inspectUrl) {
    Write-Host "[vercel] Inspeccion disponible en: $inspectUrl"
  }

  if (Wait-ForApiHealth -BaseUrl $productionUrl) {
    return
  }

  if ($deployExitCode -ne 0) {
    throw "[vercel] La CLI reporto error y la API no respondio en /api/health. Revisa el deploy en $inspectUrl"
  }

  throw "[vercel] El deploy termino sin error, pero la API no respondio en $productionUrl/api/health"
} finally {
  Pop-Location
  if (Test-Path $backupProjectPath) {
    Move-Item $backupProjectPath $rootProjectPath -Force
  }
}
