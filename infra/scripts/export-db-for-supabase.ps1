param(
  [string]$ContainerName = "printos-postgres",
  [string]$DatabaseName = "printos_ai",
  [string]$DatabaseUser = "printos",
  [string]$OutputPath = "subligo-supabase-import.sql"
)

$resolvedOutput = Join-Path (Get-Location) $OutputPath

Write-Host "[db] Exportando dump limpio desde $ContainerName/$DatabaseName ..."
docker exec $ContainerName pg_dump -U $DatabaseUser -d $DatabaseName --no-owner --no-privileges > $resolvedOutput

if ($LASTEXITCODE -ne 0) {
  throw "[db] Fallo la exportacion del dump para Supabase."
}

Write-Host "[db] Dump listo en $resolvedOutput"
