param(
  [string]$ProjectName = "v0-subligo",
  [string]$ProjectScope = "darwins-projects-052af53a",
  [string]$PrimaryUrl = "https://www.subligo.hn",
  [string]$SecondaryUrl = "https://subligo.hn",
  [string]$ExpectedMarker = "Personaliza camisetas, tazas",
  [int]$Attempts = 36,
  [int]$DelaySeconds = 10
)

$ErrorActionPreference = "Stop"

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
    [Parameter(Mandatory = $true)][string]$ExpectedMarker,
    [int]$Attempts = 36,
    [int]$DelaySeconds = 10
  )

  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    foreach ($url in $Urls) {
      try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $url -Method Get -TimeoutSec 20
        if (
          $response.StatusCode -ge 200 -and
          $response.StatusCode -lt 400 -and
          $response.Content -match [Regex]::Escape($ExpectedMarker)
        ) {
          Write-Host "[vercel] Web correcto en $url"
          return $true
        }
      } catch {
      }
    }

    Write-Host "[vercel] Esperando contenido correcto del web ($attempt/$Attempts)..."
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

  function Quote-Argument {
    param([Parameter(Mandatory = $true)][string]$Value)

    if ($Value -notmatch '[\s"]') {
      return $Value
    }

    $escaped = $Value -replace '(\\*)"', '$1$1\"'
    $escaped = $escaped -replace '(\\+)$', '$1$1'
    return '"' + $escaped + '"'
  }

  Write-Host "[vercel] $Label..."

  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName = $Executable
  $startInfo.Arguments = (($Arguments | ForEach-Object { Quote-Argument $_ }) -join " ")
  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo
  [void]$process.Start()

  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()

  $lines = @()
  if (-not [string]::IsNullOrWhiteSpace($stdout)) {
    $lines += @($stdout -split "(`r`n|`n|`r)")
  }
  if (-not [string]::IsNullOrWhiteSpace($stderr)) {
    $lines += @($stderr -split "(`r`n|`n|`r)")
  }
  $lines = @($lines | Where-Object { $_ -ne "" })

  foreach ($line in $lines) {
    Write-Host $line
  }

  if ($process.ExitCode -ne 0) {
    throw "[vercel] Fallo '$Label'."
  }

  return ,$lines
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$webRoot = Join-Path $repoRoot "apps\web"
$vercelExe = Resolve-VercelExecutable

if (-not $vercelExe) {
  throw "[vercel] No se encontro la CLI de Vercel."
}

if (!(Test-Path (Join-Path $webRoot "vercel.json"))) {
  throw "[vercel] No existe apps/web/vercel.json"
}

Push-Location $repoRoot
try {
  Invoke-VercelStep -Executable $vercelExe -Label "Enlazando apps/web al proyecto $ProjectName" -Arguments @(
    "link",
    "--yes",
    "--scope", $ProjectScope,
    "--project", $ProjectName,
    "--cwd", $webRoot
  ) | Out-Null

  $deployLines = Invoke-VercelStep -Executable $vercelExe -Label "Desplegando el web en $ProjectName desde apps/web" -Arguments @(
    "--prod",
    "--force",
    "--yes",
    "--non-interactive",
    "--scope", $ProjectScope,
    "--cwd", $webRoot
  )

  $inspectUrl = Get-FirstRegexMatch -Lines $deployLines -Pattern 'Inspect:\s+(https://\S+)'
  $productionUrl = Get-FirstRegexMatch -Lines $deployLines -Pattern 'Production:\s+(https://\S+)'
  if (-not $productionUrl) {
    $productionUrl = Get-FirstRegexMatch -Lines $deployLines -Pattern '^(https://\S+)$'
  }

  if (-not [string]::IsNullOrWhiteSpace($productionUrl)) {
    $deploymentHost = ([Uri]$productionUrl).Host
    Invoke-VercelStep -Executable $vercelExe -Label "Aliaseando www.subligo.hn al deploy nuevo" -Arguments @(
      "alias", "set", $deploymentHost, "www.subligo.hn",
      "--scope", $ProjectScope
    ) | Out-Null

    Invoke-VercelStep -Executable $vercelExe -Label "Aliaseando subligo.hn al deploy nuevo" -Arguments @(
      "alias", "set", $deploymentHost, "subligo.hn",
      "--scope", $ProjectScope
    ) | Out-Null
  }

  $aliasUrl = "https://$ProjectName.vercel.app"
  $urlsToCheck = @($PrimaryUrl, $SecondaryUrl, $aliasUrl, $productionUrl) | Where-Object { $_ } | Select-Object -Unique

  Write-Host "[vercel] Proyecto destino: $ProjectName"
  Write-Host "[vercel] Dominio primario esperado: $PrimaryUrl"
  Write-Host "[vercel] Dominio secundario esperado: $SecondaryUrl"
  if ($productionUrl) {
    Write-Host "[vercel] URL temporal de produccion: $productionUrl"
  }
  if ($inspectUrl) {
    Write-Host "[vercel] Inspeccion disponible en: $inspectUrl"
  }

  if (Wait-ForWebReady -Urls $urlsToCheck -ExpectedMarker $ExpectedMarker -Attempts $Attempts -DelaySeconds $DelaySeconds) {
    return
  }

  throw "[vercel] El deploy termino, pero ninguno de los endpoints sirvio el contenido esperado de SubliGo: $($urlsToCheck -join ', ')"
} finally {
  Pop-Location
}
