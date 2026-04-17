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
$vercelExe = Resolve-VercelExecutable

if (-not $vercelExe) {
  throw "[vercel] No se encontro la CLI de Vercel."
}

Push-Location $repoRoot
try {
  $deployOutput = & $vercelExe --prod --force --yes --non-interactive --scope $ProjectScope --project $ProjectName 2>&1
  $deployExitCode = $LASTEXITCODE
  $deployLines = @($deployOutput | ForEach-Object { "$_" })

  foreach ($line in $deployLines) {
    Write-Host $line
  }

  $inspectUrl = Get-FirstRegexMatch -Lines $deployLines -Pattern 'Inspect:\s+(https://\S+)'
  $productionUrl = Get-FirstRegexMatch -Lines $deployLines -Pattern 'Production:\s+(https://\S+)'
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

  if ($deployExitCode -ne 0) {
    throw "[vercel] La CLI reporto error y el web no respondio en ninguno de estos endpoints: $($urlsToCheck -join ', ')"
  }

  throw "[vercel] El deploy termino sin error, pero el web no respondio en ninguno de estos endpoints: $($urlsToCheck -join ', ')"
} finally {
  Pop-Location
}
