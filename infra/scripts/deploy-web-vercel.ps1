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

function Invoke-VercelStep {
  param(
    [Parameter(Mandatory = $true)][string]$Executable,
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][string[]]$Arguments
  )

  Write-Host "[vercel] $Label..."
  $output = & $Executable @Arguments 2>&1
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

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$webConfig = Join-Path $repoRoot "apps\web\vercel.json"
$vercelExe = Resolve-VercelExecutable

if (-not $vercelExe) {
  throw "[vercel] No se encontro la CLI de Vercel."
}

if (!(Test-Path $webConfig)) {
  throw "[vercel] No existe apps/web/vercel.json"
}

Push-Location $repoRoot
try {
  Invoke-VercelStep -Executable $vercelExe -Label "Enlazando la raiz del repo al proyecto $ProjectName" -Arguments @(
    "link",
    "--yes",
    "--scope", $ProjectScope,
    "--project", $ProjectName,
    "--cwd", $repoRoot
  ) | Out-Null

  $deployLines = Invoke-VercelStep -Executable $vercelExe -Label "Desplegando el web en $ProjectName desde la raiz del monorepo" -Arguments @(
    "--prod",
    "--force",
    "--yes",
    "--non-interactive",
    "--scope", $ProjectScope,
    "--cwd", $repoRoot,
    "--local-config", $webConfig
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
