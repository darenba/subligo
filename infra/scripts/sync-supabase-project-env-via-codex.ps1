param()

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

function Test-NonEmptyValue {
  param([AllowNull()][string]$Value)

  return -not [string]::IsNullOrWhiteSpace($Value)
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$envFile = Join-Path $repoRoot ".env"
$codexExe = Resolve-CodexExecutable

if (-not $codexExe) {
  throw "[codex] No se encontro codex.exe."
}

$tempDir = Join-Path $repoRoot ".tmp-codex-supabase"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$schemaPath = Join-Path $tempDir "supabase-env-schema.json"
$outputPath = Join-Path $tempDir "supabase-env.json"

@'
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "database_url",
    "direct_url",
    "supabase_url",
    "service_role_key"
  ],
  "properties": {
    "database_url": { "type": "string" },
    "direct_url": { "type": "string" },
    "supabase_url": { "type": "string" },
    "service_role_key": { "type": "string" }
  }
}
'@ | Set-Content -LiteralPath $schemaPath

$prompt = @"
Usa exclusivamente el MCP de Supabase autenticado para el proyecto iujdgqnvfeyczrcgmbbq.
Devuelve solo JSON valido con estos campos:
- database_url: la connection string recomendada para Vercel/serverless
- direct_url: la connection string recomendada para importaciones/migraciones
- supabase_url: la URL publica del proyecto
- service_role_key: la service_role key del proyecto

No inventes datos. Si no puedes leer un campo desde el MCP, falla en lugar de rellenarlo.
"@

Push-Location $repoRoot

try {
  & $codexExe exec --skip-git-repo-check --sandbox read-only --output-schema $schemaPath -o $outputPath $prompt
  if ($LASTEXITCODE -ne 0) {
    throw "[codex] Fallo la consulta de credenciales via MCP."
  }

  $result = Get-Content -LiteralPath $outputPath -Raw | ConvertFrom-Json
  $missingFields = @()

  if (-not (Test-NonEmptyValue $result.database_url)) { $missingFields += "database_url" }
  if (-not (Test-NonEmptyValue $result.direct_url)) { $missingFields += "direct_url" }
  if (-not (Test-NonEmptyValue $result.supabase_url)) { $missingFields += "supabase_url" }
  if (-not (Test-NonEmptyValue $result.service_role_key)) { $missingFields += "service_role_key" }

  if ($missingFields.Count -gt 0) {
    $joined = $missingFields -join ", "
    throw "[supabase] El MCP no expuso estos campos requeridos: $joined. No se actualizo .env."
  }

  Set-OrAppendEnvValue -FilePath $envFile -Name "DATABASE_URL" -Value $result.database_url
  Set-OrAppendEnvValue -FilePath $envFile -Name "DIRECT_URL" -Value $result.direct_url
  Set-OrAppendEnvValue -FilePath $envFile -Name "SUPABASE_URL" -Value $result.supabase_url
  Set-OrAppendEnvValue -FilePath $envFile -Name "NEXT_PUBLIC_SUPABASE_URL" -Value $result.supabase_url
  Set-OrAppendEnvValue -FilePath $envFile -Name "SUPABASE_SERVICE_ROLE_KEY" -Value $result.service_role_key

  Write-Host "[supabase] Credenciales del proyecto sincronizadas en .env"
} finally {
  Pop-Location
  Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
