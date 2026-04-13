param(
  [string]$SqlFilePath = "subligo-supabase-import.sql"
)

function Resolve-CodexExecutable {
  $command = Get-Command codex -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }

  $commandExe = Get-Command codex.exe -ErrorAction SilentlyContinue
  if ($commandExe) { return $commandExe.Source }

  $candidate = Get-ChildItem "$HOME\.cursor\extensions\openai.chatgpt-*\bin\windows-x86_64\codex.exe" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1 -ExpandProperty FullName

  if ($candidate -and (Test-Path $candidate)) {
    return $candidate
  }

  return $null
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$codexExe = Resolve-CodexExecutable
$resolvedSql = Resolve-Path (Join-Path $repoRoot $SqlFilePath) -ErrorAction Stop

if (-not $codexExe) {
  throw "[codex] No se encontro codex.exe."
}

$prompt = @"
Usa exclusivamente el MCP autenticado de Supabase para el proyecto iujdgqnvfeyczrcgmbbq.
Lee el archivo SQL local en esta ruta:
$resolvedSql

Ejecuta ese SQL contra la base remota usando las capacidades de SQL del MCP.
Si el archivo es demasiado grande para una sola llamada, dividelo en bloques seguros y aplicalos en orden hasta terminar.
Al final responde solo con un resumen corto de exito o con el primer error real encontrado.
"@

Push-Location $repoRoot

try {
  $codexOutput = & $codexExe exec --skip-git-repo-check --sandbox read-only $prompt 2>&1
  $exitCode = $LASTEXITCODE
  $outputText = ($codexOutput | ForEach-Object { "$_" }) -join [Environment]::NewLine

  foreach ($line in $codexOutput) {
    Write-Host $line
  }

  if ($exitCode -ne 0) {
    throw "[codex] Fallo la aplicacion del SQL via MCP."
  }

  if (
    $outputText -match 'user cancelled MCP tool call' -or
    $outputText -match 'no fue posible aplicar' -or
    $outputText -match 'no fue posible continuar' -or
    $outputText -match 'no fue posible'
  ) {
    throw "[supabase] El MCP no permitio ejecutar el SQL remoto. Revisa la salida anterior para el primer error real."
  }
} finally {
  Pop-Location
}
