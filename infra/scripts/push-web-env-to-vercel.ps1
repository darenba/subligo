param(
  [string]$ProjectName = "v0-subligo",
  [string]$ProjectScope = "darwins-projects-052af53a",
  [string]$WebUrl = "https://www.subligo.hn",
  [string]$ApiUrl = "https://subligo-api-app.vercel.app/api",
  [string]$AdminUrl = "https://subligo-admin-app.vercel.app/admin",
  [string]$AdminUpstreamUrl = "https://subligo-admin-app.vercel.app"
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

function Get-EnvMapFromFile {
  param([Parameter(Mandatory = $true)][string]$FilePath)

  $map = @{}
  if (!(Test-Path $FilePath)) { return $map }

  foreach ($line in Get-Content -LiteralPath $FilePath) {
    if ([string]::IsNullOrWhiteSpace($line) -or $line.TrimStart().StartsWith("#")) { continue }
    $parts = $line -split "=", 2
    if ($parts.Length -ne 2) { continue }
    $map[$parts[0].Trim()] = $parts[1].Trim()
  }

  return $map
}

function Set-OrAppendEnvValue {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Value
  )

  $content = @()
  if (Test-Path $FilePath) { $content = Get-Content -LiteralPath $FilePath }

  $updated = $false
  for ($i = 0; $i -lt $content.Count; $i++) {
    if ($content[$i] -match "^$Name=") {
      $content[$i] = "$Name=$Value"
      $updated = $true
      break
    }
  }

  if (-not $updated) { $content += "$Name=$Value" }
  Set-Content -LiteralPath $FilePath -Value $content
}

function Invoke-VercelWithExactStdin {
  param(
    [Parameter(Mandatory = $true)][string]$Executable,
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [Parameter(Mandatory = $true)][string]$InputText
  )

  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName = $Executable
  foreach ($argument in $Arguments) {
    [void]$startInfo.ArgumentList.Add($argument)
  }
  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardInput = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo
  [void]$process.Start()
  $process.StandardInput.Write($InputText)
  $process.StandardInput.Close()

  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()

  if (-not [string]::IsNullOrWhiteSpace($stdout)) {
    Write-Host $stdout.TrimEnd()
  }
  if (-not [string]::IsNullOrWhiteSpace($stderr)) {
    Write-Host $stderr.TrimEnd()
  }

  return $process.ExitCode
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$webRoot = Join-Path $repoRoot "apps\web"
$envFile = Join-Path $repoRoot ".env"
$envMap = Get-EnvMapFromFile -FilePath $envFile
$vercelExe = Resolve-VercelExecutable

if (-not $vercelExe) {
  throw "[vercel] No se encontro la CLI de Vercel."
}

if (!(Test-Path $webRoot)) {
  throw "[vercel] No existe la carpeta del web: $webRoot"
}

$defaults = @{
  "NEXT_PUBLIC_API_URL" = $ApiUrl
  "NEXT_PUBLIC_WEB_URL" = $WebUrl
  "NEXT_PUBLIC_ADMIN_URL" = $AdminUrl
  "ADMIN_UPSTREAM_URL" = $AdminUpstreamUrl
}

foreach ($pair in $defaults.GetEnumerator()) {
  if (
    [string]::IsNullOrWhiteSpace($envMap[$pair.Key]) -or
    $envMap[$pair.Key] -match "localhost|127\.0\.0\.1|TU_HOST|TU_PASSWORD|CHANGE_ME" -or
    $envMap[$pair.Key] -eq "https://subligo-web-app.vercel.app"
  ) {
    Set-OrAppendEnvValue -FilePath $envFile -Name $pair.Key -Value $pair.Value
    $envMap[$pair.Key] = $pair.Value
  }
}

$required = @(
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_WEB_URL",
  "NEXT_PUBLIC_ADMIN_URL",
  "ADMIN_UPSTREAM_URL"
)

foreach ($name in $required) {
  $value = $envMap[$name]
  if ([string]::IsNullOrWhiteSpace($value) -or $value -match "localhost|127\.0\.0\.1|TU_HOST|TU_PASSWORD|CHANGE_ME") {
    throw "[vercel] $name no esta listo en .env"
  }
}

try {
  Push-Location $repoRoot
  & $vercelExe link --yes --scope $ProjectScope --project $ProjectName --cwd $webRoot
  if ($LASTEXITCODE -ne 0) {
    throw "[vercel] Fallo al enlazar apps/web con el proyecto $ProjectName."
  }

  foreach ($name in $required) {
    $exitCode = Invoke-VercelWithExactStdin -Executable $vercelExe -Arguments @(
      "env", "add", $name, "production",
      "--force", "--yes", "--non-interactive",
      "--scope", $ProjectScope,
      "--cwd", $webRoot
    ) -InputText $envMap[$name]

    if ($exitCode -ne 0) {
      throw "[vercel] Fallo al subir $name al proyecto web $ProjectName."
    }
  }
} finally {
  Pop-Location
}

Write-Host "[vercel] Variables del web sincronizadas en produccion para $ProjectName."
