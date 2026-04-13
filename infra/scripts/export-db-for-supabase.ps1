param(
  [string]$ContainerName = "printos-postgres",
  [string]$DatabaseName = "printos_ai",
  [string]$DatabaseUser = "printos",
  [string]$OutputPath = "subligo-supabase-import.sql",
  [ValidateSet("Full", "DataOnly")][string]$Mode = "Full",
  [switch]$AsInserts,
  [switch]$ColumnInserts,
  [int]$RowsPerInsert = 100
)

$resolvedOutput = Join-Path (Get-Location) $OutputPath

$pgDumpArgs = @(
  "-U", $DatabaseUser,
  "-d", $DatabaseName,
  "--no-owner",
  "--no-privileges"
)

if ($Mode -eq "DataOnly") {
  $pgDumpArgs += "--data-only"
}

if ($AsInserts) {
  $pgDumpArgs += "--inserts"
}

if ($ColumnInserts) {
  $pgDumpArgs += "--column-inserts"
}

if ($AsInserts -and $RowsPerInsert -gt 0) {
  $pgDumpArgs += "--rows-per-insert=$RowsPerInsert"
}

$modeLabel = if ($Mode -eq "DataOnly") { "data-only" } else { "full" }
$formatLabel = if ($AsInserts) { "INSERT" } else { "COPY" }

Write-Host "[db] Exportando dump $modeLabel en formato $formatLabel desde $ContainerName/$DatabaseName ..."
docker exec $ContainerName pg_dump @pgDumpArgs > $resolvedOutput

if ($LASTEXITCODE -ne 0) {
  throw "[db] Fallo la exportacion del dump para Supabase."
}

Write-Host "[db] Dump listo en $resolvedOutput"
