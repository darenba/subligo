param(
  [string]$ConnectionString,

  [string]$DumpPath = "subligo-supabase-import.sql"
)

function Get-EnvValueFromFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  if (!(Test-Path $FilePath)) {
    return $null
  }

  $match = Get-Content -LiteralPath $FilePath |
    Where-Object { $_ -match "^$Name=" } |
    Select-Object -First 1

  if ($null -eq $match) {
    return $null
  }

  return $match.Substring($Name.Length + 1).Trim()
}

$resolvedDump = Resolve-Path $DumpPath -ErrorAction Stop
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$envFile = Join-Path $repoRoot ".env"

if ([string]::IsNullOrWhiteSpace($ConnectionString)) {
  $ConnectionString = Get-EnvValueFromFile -FilePath $envFile -Name "DIRECT_URL"
}

if ([string]::IsNullOrWhiteSpace($ConnectionString)) {
  throw "[db] No existe DIRECT_URL en .env y tampoco se paso -ConnectionString."
}

if ($ConnectionString -match "TU_HOST|TU_PASSWORD|CHANGE_ME|localhost|127\.0\.0\.1") {
  throw "[db] DIRECT_URL sigue apuntando a placeholders o a la base local. Actualiza .env con la conexion real de Supabase."
}

Write-Host "[db] Importando $resolvedDump a la base remota ..."

Get-Content -LiteralPath $resolvedDump |
  docker run --rm -i -e TARGET_DB_URL="$ConnectionString" postgres:16-alpine sh -lc 'cat >/tmp/import.sql && psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f /tmp/import.sql'

if ($LASTEXITCODE -ne 0) {
  throw "[db] Fallo la importacion del dump."
}

Write-Host "[db] Importacion completada."
