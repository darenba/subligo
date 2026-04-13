param()

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

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$envFile = Join-Path $repoRoot ".env"
$envMap = Get-EnvMapFromFile -FilePath $envFile

$defaults = @{
  "NEXT_PUBLIC_API_URL" = "https://subligo-api-app.vercel.app/api"
  "NEXT_PUBLIC_WEB_URL" = "https://subligo-web-app.vercel.app"
  "NEXT_PUBLIC_ADMIN_URL" = "https://subligo-admin-app.vercel.app/admin"
  "ADMIN_UPSTREAM_URL" = "https://subligo-admin-app.vercel.app"
}

foreach ($pair in $defaults.GetEnumerator()) {
  if ([string]::IsNullOrWhiteSpace($envMap[$pair.Key])) {
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

$tempDir = Join-Path $repoRoot ".tmp-vercel-env"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

try {
  Push-Location $repoRoot
  foreach ($name in $required) {
    $tempFile = Join-Path $tempDir "$name.txt"
    Set-Content -LiteralPath $tempFile -Value $envMap[$name] -NoNewline
    cmd /c "type `"$tempFile`" | vercel env add $name production --force"
    if ($LASTEXITCODE -ne 0) {
      throw "[vercel] Fallo al subir $name al proyecto web."
    }
  }
} finally {
  Pop-Location
  Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "[vercel] Variables del web sincronizadas en produccion."
