param()

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$mcpPath = Join-Path $repoRoot ".mcp.json"

if (!(Test-Path $mcpPath)) {
  throw "[supabase] No existe .mcp.json en la raiz del repo."
}

$mcp = Get-Content -LiteralPath $mcpPath -Raw | ConvertFrom-Json
$url = $mcp.mcpServers.supabase.url

if ([string]::IsNullOrWhiteSpace($url) -or $url -notmatch "project_ref=([a-z0-9]+)") {
  throw "[supabase] No se pudo extraer project_ref desde .mcp.json."
}

$projectRef = $Matches[1]

Start-Process "https://supabase.com/dashboard/project/$projectRef/sql/new"
Start-Process "https://supabase.com/dashboard/project/$projectRef/settings/database"
Start-Process "https://supabase.com/dashboard/project/$projectRef/settings/api"

Write-Host "[supabase] Abiertas las paginas del proyecto $projectRef en el navegador."
