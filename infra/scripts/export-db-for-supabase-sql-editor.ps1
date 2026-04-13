param(
  [string]$ContainerName = "printos-postgres",
  [string]$DatabaseName = "printos_ai",
  [string]$DatabaseUser = "printos",
  [string]$OutputPath = "subligo-supabase-data-import.sql",
  [int]$RowsPerInsert = 100
)

$exportScript = Join-Path $PSScriptRoot "export-db-for-supabase.ps1"

if (!(Test-Path $exportScript)) {
  throw "[db] No existe el exportador base en $exportScript"
}

& $exportScript `
  -ContainerName $ContainerName `
  -DatabaseName $DatabaseName `
  -DatabaseUser $DatabaseUser `
  -OutputPath $OutputPath `
  -Mode DataOnly `
  -AsInserts `
  -ColumnInserts `
  -RowsPerInsert $RowsPerInsert

if ($LASTEXITCODE -ne 0) {
  throw "[db] Fallo la generacion del SQL para el SQL Editor de Supabase."
}

Write-Host "[db] Archivo listo para importacion manual en Supabase SQL Editor: $OutputPath"
