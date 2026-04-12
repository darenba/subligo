param(
  [Parameter(Mandatory = $true)]
  [string]$ConnectionString,

  [string]$DumpPath = "subligo-supabase-import.sql"
)

$resolvedDump = Resolve-Path $DumpPath -ErrorAction Stop

Write-Host "[db] Importando $resolvedDump a la base remota ..."

Get-Content -LiteralPath $resolvedDump |
  docker run --rm -i -e TARGET_DB_URL="$ConnectionString" postgres:16-alpine sh -lc 'cat >/tmp/import.sql && psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f /tmp/import.sql'

if ($LASTEXITCODE -ne 0) {
  throw "[db] Fallo la importacion del dump."
}

Write-Host "[db] Importacion completada."
