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
$rootVercelDir = Join-Path $repoRoot ".vercel"
$rootProjectPath = Join-Path $rootVercelDir "project.json"
$backupProjectPath = Join-Path $rootVercelDir "project.web.json"
$adminProjectPath = Join-Path $repoRoot "apps\admin\.vercel\project.json"

if (!(Test-Path $rootProjectPath)) {
  throw "[vercel] No existe .vercel/project.json en la raiz del repo."
}

if (!(Test-Path $adminProjectPath)) {
  throw "[vercel] No existe apps/admin/.vercel/project.json."
}

$envMap = Get-EnvMapFromFile -FilePath $envFile

$defaults = @{
  "NEXT_PUBLIC_API_URL" = "https://subligo-api-app.vercel.app/api"
  "PUBLIC_API_BASE_URL" = "https://subligo-api-app.vercel.app"
  "NEXT_PUBLIC_ADMIN_URL" = "https://subligo-admin-app.vercel.app/admin"
}

foreach ($pair in $defaults.GetEnumerator()) {
  if ([string]::IsNullOrWhiteSpace($envMap[$pair.Key]) -or $envMap[$pair.Key] -match "localhost|127\.0\.0\.1|TU_HOST|TU_PASSWORD|CHANGE_ME") {
    Set-OrAppendEnvValue -FilePath $envFile -Name $pair.Key -Value $pair.Value
    $envMap[$pair.Key] = $pair.Value
  }
}

$required = @(
  "NEXT_PUBLIC_API_URL",
  "PUBLIC_API_BASE_URL",
  "NEXT_PUBLIC_ADMIN_URL"
)

foreach ($name in $required) {
  $value = $envMap[$name]
  if ([string]::IsNullOrWhiteSpace($value) -or $value -match "localhost|127\.0\.0\.1|TU_HOST|TU_PASSWORD|CHANGE_ME") {
    throw "[vercel] $name no esta listo en .env"
  }
}

Copy-Item $rootProjectPath $backupProjectPath -Force
Copy-Item $adminProjectPath $rootProjectPath -Force

$tempDir = Join-Path $repoRoot ".tmp-vercel-env"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

try {
  Push-Location $repoRoot
  foreach ($name in $required) {
    $tempFile = Join-Path $tempDir "$name.txt"
    Set-Content -LiteralPath $tempFile -Value $envMap[$name] -NoNewline
    cmd /c "type `"$tempFile`" | vercel env add $name production --force --yes --non-interactive"
    if ($LASTEXITCODE -ne 0) {
      throw "[vercel] Fallo al subir $name al proyecto admin."
    }
  }
} finally {
  Pop-Location
  if (Test-Path $backupProjectPath) {
    Move-Item $backupProjectPath $rootProjectPath -Force
  }
  Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "[vercel] Variables del admin sincronizadas en produccion."
