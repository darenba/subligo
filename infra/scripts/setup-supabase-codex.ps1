param()

function Resolve-CodexExecutable {
  $command = Get-Command codex -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $commandExe = Get-Command codex.exe -ErrorAction SilentlyContinue
  if ($commandExe) {
    return $commandExe.Source
  }

  $candidates = @(
    (Get-ChildItem "$HOME\.cursor\extensions\openai.chatgpt-*\bin\windows-x86_64\codex.exe" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName),
    "$HOME\AppData\Local\Microsoft\WinGet\Links\codex.exe"
  ) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

  return $candidates
}

function Set-OrAppendEnvValue {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Value
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
$codexDir = Join-Path $HOME ".codex"
$codexConfig = Join-Path $codexDir "config.toml"
$supabaseMcpUrl = "https://mcp.supabase.com/mcp?project_ref=iujdgqnvfeyczrcgmbbq"
$codexExe = Resolve-CodexExecutable

New-Item -ItemType Directory -Force -Path $codexDir | Out-Null

if (!(Test-Path $codexConfig)) {
  Set-Content -LiteralPath $codexConfig -Value @(
    "[mcp]",
    "remote_mcp_client_enabled = true"
  )
} else {
  $configContent = Get-Content -LiteralPath $codexConfig -Raw
  if ($configContent -notmatch "(?m)^\[mcp\]\s*$") {
    Add-Content -LiteralPath $codexConfig -Value @(
      "",
      "[mcp]",
      "remote_mcp_client_enabled = true"
    )
  } elseif ($configContent -match "(?m)^remote_mcp_client_enabled\s*=") {
    $updated = [regex]::Replace($configContent, "(?m)^remote_mcp_client_enabled\s*=.*$", "remote_mcp_client_enabled = true")
    Set-Content -LiteralPath $codexConfig -Value $updated
  } else {
    $updated = [regex]::Replace($configContent, "(?m)^\[mcp\]\s*$", "[mcp]`r`nremote_mcp_client_enabled = true")
    Set-Content -LiteralPath $codexConfig -Value $updated
  }
}

$configAfterMcp = Get-Content -LiteralPath $codexConfig -Raw
if ($configAfterMcp -notmatch "(?m)^\[mcp_servers\.supabase\]\s*$") {
  Add-Content -LiteralPath $codexConfig -Value @(
    "",
    "[mcp_servers.supabase]",
    "url = `"$supabaseMcpUrl`""
  )
}

Set-OrAppendEnvValue -FilePath $envFile -Name "DATABASE_URL" -Value "postgresql://postgres:De%40dp00l08011@db.iujdgqnvfeyczrcgmbbq.supabase.co:5432/postgres?schema=public&sslmode=require"
Set-OrAppendEnvValue -FilePath $envFile -Name "DIRECT_URL" -Value "postgresql://postgres:De%40dp00l08011@db.iujdgqnvfeyczrcgmbbq.supabase.co:5432/postgres?schema=public&sslmode=require"
Set-OrAppendEnvValue -FilePath $envFile -Name "SUPABASE_URL" -Value "https://iujdgqnvfeyczrcgmbbq.supabase.co"
Set-OrAppendEnvValue -FilePath $envFile -Name "NEXT_PUBLIC_SUPABASE_URL" -Value "https://iujdgqnvfeyczrcgmbbq.supabase.co"
Set-OrAppendEnvValue -FilePath $envFile -Name "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" -Value "sb_publishable_u6DxH3cj_heVIvTqB0mfyQ_Ddg-_xQM"

Push-Location $repoRoot

try {
  if ($codexExe) {
    & $codexExe mcp add supabase --url $supabaseMcpUrl
    if ($LASTEXITCODE -ne 0) {
      Write-Host "[codex] 'supabase' ya existia o no se pudo agregar automaticamente. Continuando..."
    }
  } else {
    Write-Host "[codex] No se encontro codex en PATH, pero la entrada MCP ya quedo escrita en $codexConfig"
  }

  if (Test-Path (Join-Path $repoRoot "skills-lock.json")) {
    $skillsLock = Get-Content -LiteralPath (Join-Path $repoRoot "skills-lock.json") -Raw
    if ($skillsLock -match '"supabase"') {
      Write-Host "[skills] supabase/agent-skills ya esta instalado."
    } else {
      npx skills add supabase/agent-skills
    }
  } else {
    npx skills add supabase/agent-skills
  }

  pnpm --filter @printos/web add @supabase/supabase-js @supabase/ssr

  Write-Host ""
  Write-Host "[codex] Ejecuta ahora la autenticacion OAuth del MCP de Supabase:"
  if ($codexExe) {
    Write-Host "`"$codexExe`" mcp login supabase"
  } else {
    Write-Host "codex mcp login supabase"
  }
  Write-Host ""
  Write-Host "[db] Luego puedes importar directo con:"
  Write-Host "powershell -ExecutionPolicy Bypass -File .\infra\scripts\import-db-to-postgres.ps1"
} finally {
  Pop-Location
}
