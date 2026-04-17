param(
  [string]$ProjectName = "v0-subligo",
  [string]$ProjectScope = "darwins-projects-052af53a",
  [string]$PrimaryUrl = "https://www.subligo.hn",
  [int]$Attempts = 36,
  [int]$DelaySeconds = 10
)

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

function Wait-ForWebReady {
  param(
    [Parameter(Mandatory = $true)][string[]]$Urls,
    [int]$Attempts = 36,
    [int]$DelaySeconds = 10
  )

  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    foreach ($url in $Urls) {
      try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $url -Method Get -TimeoutSec 20
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
          Write-Host "[vercel] Web funcionando en $url"
          return $true
        }
      } catch {
      }
    }

    Write-Host "[vercel] Esperando disponibilidad del web ($attempt/$Attempts)..."
    if ($attempt -lt $Attempts) {
      Start-Sleep -Seconds $DelaySeconds
    }
  }

  return $false
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$webRoot = Join-Path $repoRoot "apps\web"
$outputDir = Join-Path $webRoot ".vercel\output"
$vercelExe = Resolve-VercelExecutable

if (-not $vercelExe) {
  throw "[vercel] No se encontro la CLI de Vercel."
}

if (!(Test-Path $webRoot)) {
  throw "[vercel] No existe la carpeta del web: $webRoot"
}

function Invoke-VercelStep {
  param(
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][string[]]$Arguments
  )

  Write-Host "[vercel] $Label..."
  $output = & $vercelExe @Arguments 2>&1
  $exitCode = $LASTEXITCODE
  $lines = @($output | ForEach-Object { "$_" })
  foreach ($line in $lines) {
    Write-Host $line
  }
  if ($exitCode -ne 0) {
    throw "[vercel] Fallo '$Label'."
  }
  return ,$lines
}

Push-Location $repoRoot
try {
  if (Test-Path $outputDir) {
    Remove-Item -LiteralPath $outputDir -Recurse -Force -ErrorAction SilentlyContinue
  }

  Invoke-VercelStep -Label "Enlazando apps/web al proyecto $ProjectName" -Arguments @(
    "link",
    "--yes",
    "--scope", $ProjectScope,
    "--project", $ProjectName,
    "--cwd", $webRoot
  ) | Out-Null

  Invoke-VercelStep -Label "Descargando configuracion de produccion para $ProjectName" -Arguments @(
    "pull",
    "--yes",
    "--environment=production",
    "--scope", $ProjectScope,
    "--project", $ProjectName,
    "--cwd", $webRoot
  ) | Out-Null

  Invoke-VercelStep -Label "Construyendo web localmente para produccion" -Arguments @(
    "build",
    "--prod",
    "--scope", $ProjectScope,
    "--project", $ProjectName,
    "--cwd", $webRoot
  ) | Out-Null

  $deployLines = Invoke-VercelStep -Label "Publicando build precompilado en $ProjectName" -Arguments @(
    "deploy",
    "--prebuilt",
    "--prod",
    "--yes",
    "--non-interactive",
    "--scope", $ProjectScope,
    "--project", $ProjectName,
    "--cwd", $webRoot
  )

  $inspectUrl = Get-FirstRegexMatch -Lines $deployLines -Pattern 'Inspect:\s+(https://\S+)'
  $productionUrl = Get-FirstRegexMatch -Lines $deployLines -Pattern 'Production:\s+(https://\S+)'
  if (-not $productionUrl) {
    $productionUrl = Get-FirstRegexMatch -Lines $deployLines -Pattern '^(https://\S+)$'
  }
  $aliasUrl = "https://$ProjectName.vercel.app"
  $urlsToCheck = @($PrimaryUrl, $aliasUrl, $productionUrl) | Where-Object { $_ } | Select-Object -Unique

  Write-Host "[vercel] Proyecto destino: $ProjectName"
  Write-Host "[vercel] Dominio primario esperado: $PrimaryUrl"
  if ($productionUrl) {
    Write-Host "[vercel] URL temporal de produccion: $productionUrl"
  }
  if ($inspectUrl) {
    Write-Host "[vercel] Inspeccion disponible en: $inspectUrl"
  }

  if (Wait-ForWebReady -Urls $urlsToCheck -Attempts $Attempts -DelaySeconds $DelaySeconds) {
    return
  }

  throw "[vercel] El deploy termino sin error, pero el web no respondio en ninguno de estos endpoints: $($urlsToCheck -join ', ')"
} finally {
  Pop-Location
}
