param()

function Get-EnvMapFromFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath
  )

  $map = @{}

  if (!(Test-Path $FilePath)) {
    return $map
  }

  foreach ($line in Get-Content -LiteralPath $FilePath) {
    if ([string]::IsNullOrWhiteSpace($line) -or $line.TrimStart().StartsWith("#")) {
      continue
    }

    $parts = $line -split "=", 2
    if ($parts.Length -ne 2) {
      continue
    }

    $map[$parts[0].Trim()] = $parts[1].Trim()
  }

  return $map
}

function Set-OrAppendEnvValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  $content = @()
  if (Test-Path $FilePath) {
    $content = Get-Content -LiteralPath $FilePath
  }

  $updated = $false
  for ($i = 0; $i -lt $content.Count; $i++) {
    if ($content[$i] -match "^$Name=") {
      $content[$i] = "$Name=$Value"
      $updated = $true
      break
    }
  }

  if (-not $updated) {
    $content += "$Name=$Value"
  }

  Set-Content -LiteralPath $FilePath -Value $content
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$envFile = Join-Path $repoRoot ".env"
$rootVercelDir = Join-Path $repoRoot ".vercel"
$rootProjectPath = Join-Path $rootVercelDir "project.json"
$backupProjectPath = Join-Path $rootVercelDir "project.web.json"
$apiProjectPath = Join-Path $repoRoot "apps\api\.vercel\project.json"

if (!(Test-Path $envFile)) {
  throw "[vercel] No existe .env en la raiz del repo."
}

if (!(Test-Path $rootProjectPath)) {
  throw "[vercel] No existe .vercel/project.json en la raiz del repo."
}

if (!(Test-Path $apiProjectPath)) {
  throw "[vercel] No existe apps/api/.vercel/project.json. Ejecuta primero 'vercel link --cwd apps/api --yes --scope darwins-projects-052af53a --project subligo-api-app'."
}

$envMap = Get-EnvMapFromFile -FilePath $envFile

if ([string]::IsNullOrWhiteSpace($envMap["JWT_SECRET"])) {
  $jwt = [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
  Set-OrAppendEnvValue -FilePath $envFile -Name "JWT_SECRET" -Value $jwt
  $envMap["JWT_SECRET"] = $jwt
  Write-Host "[vercel] JWT_SECRET generado y guardado en .env"
}

$defaults = @{
  "PUBLIC_API_BASE_URL" = "https://subligo-api-app.vercel.app"
  "NEXT_PUBLIC_WEB_URL" = "https://subligo-web-app.vercel.app"
  "NEXT_PUBLIC_ADMIN_URL" = "https://subligo-admin-app.vercel.app/admin"
}

foreach ($pair in $defaults.GetEnumerator()) {
  if ([string]::IsNullOrWhiteSpace($envMap[$pair.Key]) -or $envMap[$pair.Key] -match "localhost|127\.0\.0\.1|TU_HOST|TU_PASSWORD|CHANGE_ME") {
    Set-OrAppendEnvValue -FilePath $envFile -Name $pair.Key -Value $pair.Value
    $envMap[$pair.Key] = $pair.Value
  }
}

$requiredCore = @(
  "DATABASE_URL",
  "DIRECT_URL",
  "PUBLIC_API_BASE_URL",
  "NEXT_PUBLIC_WEB_URL",
  "NEXT_PUBLIC_ADMIN_URL",
  "JWT_SECRET"
)

foreach ($name in $requiredCore) {
  $value = $envMap[$name]
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "[vercel] Falta $name en .env"
  }

  if ($name -in @("DATABASE_URL", "DIRECT_URL") -and $value -match "localhost|127\.0\.0\.1|TU_HOST|TU_PASSWORD|CHANGE_ME") {
    throw "[vercel] $name sigue apuntando a placeholders o a entorno local."
  }
}

$optionalStorage = @()
$hasSupabaseUrl = -not [string]::IsNullOrWhiteSpace($envMap["SUPABASE_URL"]) -and $envMap["SUPABASE_URL"] -notmatch "localhost|127\.0\.0\.1|TU_HOST|TU_PASSWORD|CHANGE_ME"
$hasServiceRole = -not [string]::IsNullOrWhiteSpace($envMap["SUPABASE_SERVICE_ROLE_KEY"]) -and $envMap["SUPABASE_SERVICE_ROLE_KEY"] -notmatch "localhost|127\.0\.0\.1|TU_HOST|TU_PASSWORD|CHANGE_ME"

if ($hasSupabaseUrl -and $hasServiceRole) {
  if ([string]::IsNullOrWhiteSpace($envMap["SUPABASE_PUBLIC_BUCKET"])) {
    Set-OrAppendEnvValue -FilePath $envFile -Name "SUPABASE_PUBLIC_BUCKET" -Value "printos-public"
    $envMap["SUPABASE_PUBLIC_BUCKET"] = "printos-public"
  }
  if ([string]::IsNullOrWhiteSpace($envMap["SUPABASE_PRIVATE_BUCKET"])) {
    Set-OrAppendEnvValue -FilePath $envFile -Name "SUPABASE_PRIVATE_BUCKET" -Value "printos-private"
    $envMap["SUPABASE_PRIVATE_BUCKET"] = "printos-private"
  }

  $optionalStorage = @(
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_PUBLIC_BUCKET",
    "SUPABASE_PRIVATE_BUCKET"
  )
} else {
  Write-Host "[vercel] SUPABASE_SERVICE_ROLE_KEY no esta disponible. La API se desplegara sin storage remoto."
}

$varsToPush = $requiredCore + $optionalStorage

Copy-Item $rootProjectPath $backupProjectPath -Force
Copy-Item $apiProjectPath $rootProjectPath -Force

$tempDir = Join-Path $repoRoot ".tmp-vercel-env"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

try {
  Push-Location $repoRoot

  foreach ($name in $varsToPush) {
    $tempFile = Join-Path $tempDir "$name.txt"
    Set-Content -LiteralPath $tempFile -Value $envMap[$name] -NoNewline
    cmd /c "type `"$tempFile`" | vercel env add $name production --force --yes --non-interactive"
    if ($LASTEXITCODE -ne 0) {
      throw "[vercel] Fallo al subir $name a Vercel."
    }
  }
} finally {
  Pop-Location
  if (Test-Path $backupProjectPath) {
    Move-Item $backupProjectPath $rootProjectPath -Force
  }
  Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "[vercel] Variables del API sincronizadas en produccion."
