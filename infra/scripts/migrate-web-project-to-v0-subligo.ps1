param(
  [string]$SourceProjectName = "subligo-web-app",
  [string]$TargetProjectName = "v0-subligo",
  [string]$ProjectScope = "darwins-projects-052af53a",
  [string]$PrimaryDomain = "https://www.subligo.hn"
)

$ErrorActionPreference = "Stop"

function Resolve-VercelExecutable {
  $cmd = Get-Command vercel.cmd -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  $ps1 = Get-Command vercel -ErrorAction SilentlyContinue
  if ($ps1) { return $ps1.Source }

  $candidate = Join-Path $HOME "AppData\Roaming\npm\vercel.cmd"
  if (Test-Path $candidate) { return $candidate }

  return $null
}

function Get-VercelSession {
  $authPath = Join-Path $HOME "AppData\Roaming\com.vercel.cli\Data\auth.json"
  $configPath = Join-Path $HOME "AppData\Roaming\com.vercel.cli\Data\config.json"

  if (!(Test-Path $authPath)) {
    throw "[vercel] No se encontro auth.json de la CLI de Vercel."
  }

  if (!(Test-Path $configPath)) {
    throw "[vercel] No se encontro config.json de la CLI de Vercel."
  }

  $auth = Get-Content -LiteralPath $authPath -Raw | ConvertFrom-Json
  $config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json

  if ([string]::IsNullOrWhiteSpace($auth.token)) {
    throw "[vercel] No hay token activo en la CLI de Vercel."
  }

  if ([string]::IsNullOrWhiteSpace($config.currentTeam)) {
    throw "[vercel] No hay team activo en la CLI de Vercel."
  }

  return @{
    Token = $auth.token
    TeamId = $config.currentTeam
  }
}

function Invoke-VercelApi {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Session,
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Path,
    [object]$Body
  )

  $headers = @{
    Authorization = "Bearer $($Session.Token)"
  }

  $uri = "https://api.vercel.com$Path"

  if ($null -ne $Body) {
    $json = $Body | ConvertTo-Json -Depth 20
    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -ContentType "application/json" -Body $json
  }

  return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
}

function Get-ProjectInfo {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Session,
    [Parameter(Mandatory = $true)][string]$ProjectName
  )

  return Invoke-VercelApi -Session $Session -Method Get -Path "/v9/projects/$ProjectName?teamId=$($Session.TeamId)"
}

function Get-ProjectDomains {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Session,
    [Parameter(Mandatory = $true)][string]$ProjectName
  )

  $response = Invoke-VercelApi -Session $Session -Method Get -Path "/v9/projects/$ProjectName/domains?teamId=$($Session.TeamId)"
  return @($response.domains)
}

function Get-ProjectEnvs {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Session,
    [Parameter(Mandatory = $true)][string]$ProjectName
  )

  $response = Invoke-VercelApi -Session $Session -Method Get -Path "/v10/projects/$ProjectName/env?teamId=$($Session.TeamId)&decrypt=true"
  if ($response -is [System.Array]) { return @($response) }
  if ($null -ne $response.envs) { return @($response.envs) }
  return @($response)
}

function Get-SafeProjectValue {
  param(
    [Parameter(Mandatory = $true)]$Project,
    [Parameter(Mandatory = $true)][string]$Name
  )

  $value = $Project.$Name
  if ($null -eq $value -or [string]::IsNullOrWhiteSpace("$value")) {
    return "(vacio)"
  }

  return "$value"
}

function Get-RepoSummary {
  param([Parameter(Mandatory = $true)]$Project)

  if ($null -eq $Project.link) {
    return "(sin enlace Git expuesto)"
  }

  $repo = if ($Project.link.repo) { $Project.link.repo } elseif ($Project.link.repoId) { $Project.link.repoId } else { "repo-no-expuesto" }
  $productionBranch = if ($Project.link.productionBranch) { $Project.link.productionBranch } else { "branch-no-expuesta" }
  return "$repo | branch: $productionBranch"
}

function Show-AuditSummary {
  param(
    [Parameter(Mandatory = $true)][string]$ProjectName,
    [Parameter(Mandatory = $true)]$Project,
    [Parameter(Mandatory = $true)][object[]]$Domains,
    [Parameter(Mandatory = $true)][object[]]$Envs
  )

  Write-Host "[audit] Proyecto: $ProjectName"
  Write-Host "  Repo/branch: $(Get-RepoSummary -Project $Project)"
  Write-Host "  Root directory: $(Get-SafeProjectValue -Project $Project -Name 'rootDirectory')"
  Write-Host "  Framework: $(Get-SafeProjectValue -Project $Project -Name 'framework')"
  Write-Host "  Install command: $(Get-SafeProjectValue -Project $Project -Name 'installCommand')"
  Write-Host "  Build command: $(Get-SafeProjectValue -Project $Project -Name 'buildCommand')"
  Write-Host "  Output directory: $(Get-SafeProjectValue -Project $Project -Name 'outputDirectory')"
  Write-Host "  Node version: $(Get-SafeProjectValue -Project $Project -Name 'nodeVersion')"
  Write-Host "  Dominios: $((@($Domains | ForEach-Object { $_.name }) -join ', '))"
  Write-Host "  Variables: $(@($Envs | Where-Object { $_.type -ne 'system' }).Count)"
}

function Sync-TargetProjectSettings {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Session,
    [Parameter(Mandatory = $true)][string]$TargetProjectName,
    [Parameter(Mandatory = $true)]$SourceProject,
    [Parameter(Mandatory = $true)]$LocalWebConfig
  )

  $payload = @{
    framework = if ($SourceProject.framework) { $SourceProject.framework } else { $LocalWebConfig.framework }
    rootDirectory = $SourceProject.rootDirectory
    outputDirectory = $SourceProject.outputDirectory
    nodeVersion = $SourceProject.nodeVersion
    devCommand = $SourceProject.devCommand
    installCommand = $LocalWebConfig.installCommand
    buildCommand = $LocalWebConfig.buildCommand
  }

  Write-Host "[sync] Alineando settings de Vercel en $TargetProjectName..."
  $null = Invoke-VercelApi -Session $Session -Method Patch -Path "/v9/projects/$TargetProjectName?teamId=$($Session.TeamId)" -Body $payload
}

function Sync-TargetEnvVars {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Session,
    [Parameter(Mandatory = $true)][string]$SourceProjectName,
    [Parameter(Mandatory = $true)][string]$TargetProjectName
  )

  $sourceEnvs = Get-ProjectEnvs -Session $Session -ProjectName $SourceProjectName
  $copyable = @($sourceEnvs | Where-Object { $_.type -ne "system" })

  if ($copyable.Count -eq 0) {
    Write-Warning "[sync] No se encontraron variables copiables en $SourceProjectName."
    return
  }

  $payload = foreach ($envVar in $copyable) {
    @{
      key = $envVar.key
      value = $envVar.value
      target = @($envVar.target)
      type = if ($envVar.type -eq "secret") { "encrypted" } else { "plain" }
    }
  }

  Write-Host "[sync] Copiando variables del proyecto fuente hacia $TargetProjectName..."
  $null = Invoke-VercelApi -Session $Session -Method Post -Path "/v10/projects/$TargetProjectName/env?teamId=$($Session.TeamId)&upsert=true" -Body $payload
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$pushEnvScript = Join-Path $PSScriptRoot "push-web-env-to-vercel.ps1"
$deployScript = Join-Path $PSScriptRoot "deploy-web-vercel.ps1"
$localWebConfigPath = Join-Path $repoRoot "apps\web\vercel.json"
$vercelExe = Resolve-VercelExecutable

if (-not $vercelExe) {
  throw "[vercel] No se encontro la CLI de Vercel."
}

if (!(Test-Path $pushEnvScript)) {
  throw "[migrate] No existe $pushEnvScript"
}

if (!(Test-Path $deployScript)) {
  throw "[migrate] No existe $deployScript"
}

if (!(Test-Path $localWebConfigPath)) {
  throw "[migrate] No existe $localWebConfigPath"
}

Push-Location $repoRoot
try {
  $session = Get-VercelSession
  $localWebConfig = Get-Content -LiteralPath $localWebConfigPath -Raw | ConvertFrom-Json
  $sourceProject = Get-ProjectInfo -Session $session -ProjectName $SourceProjectName
  $targetProject = Get-ProjectInfo -Session $session -ProjectName $TargetProjectName
  $sourceDomains = Get-ProjectDomains -Session $session -ProjectName $SourceProjectName
  $targetDomains = Get-ProjectDomains -Session $session -ProjectName $TargetProjectName
  $sourceEnvs = Get-ProjectEnvs -Session $session -ProjectName $SourceProjectName
  $targetEnvs = Get-ProjectEnvs -Session $session -ProjectName $TargetProjectName

  Write-Host "[migrate] Migrando el web desde $SourceProjectName hacia $TargetProjectName..."
  Write-Host "[migrate] El proyecto destino se publicara en $PrimaryDomain y en https://$TargetProjectName.vercel.app"
  Write-Host "[migrate] Usando la sesion autenticada del CLI de Vercel para evitar el token vencido de la REST API."

  Write-Host "[audit] Resumen del proyecto fuente:"
  Show-AuditSummary -ProjectName $SourceProjectName -Project $sourceProject -Domains $sourceDomains -Envs $sourceEnvs
  Write-Host "[audit] Resumen del proyecto destino:"
  Show-AuditSummary -ProjectName $TargetProjectName -Project $targetProject -Domains $targetDomains -Envs $targetEnvs

  Sync-TargetProjectSettings -Session $session -TargetProjectName $TargetProjectName -SourceProject $sourceProject -LocalWebConfig $localWebConfig
  Sync-TargetEnvVars -Session $session -SourceProjectName $SourceProjectName -TargetProjectName $TargetProjectName

  Write-Host "[migrate] Sincronizando variables de entorno del web en $TargetProjectName..."
  & powershell -ExecutionPolicy Bypass -File $pushEnvScript `
    -ProjectName $TargetProjectName `
    -ProjectScope $ProjectScope `
    -WebUrl $PrimaryDomain
  if ($LASTEXITCODE -ne 0) {
    throw "[migrate] Fallo la sincronizacion de variables del web."
  }

  Write-Host "[migrate] Construyendo y desplegando el web en $TargetProjectName..."
  & powershell -ExecutionPolicy Bypass -File $deployScript `
    -ProjectName $TargetProjectName `
    -ProjectScope $ProjectScope `
    -PrimaryUrl $PrimaryDomain
  if ($LASTEXITCODE -ne 0) {
    throw "[migrate] Fallo el deploy del web."
  }

  Write-Host "[migrate] Migracion completada."
  Write-Host "[migrate] Produccion: $PrimaryDomain"
  Write-Host "[migrate] Alias de Vercel: https://$TargetProjectName.vercel.app"
} finally {
  Pop-Location
}
