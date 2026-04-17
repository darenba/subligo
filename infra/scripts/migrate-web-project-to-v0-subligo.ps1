param(
  [string]$SourceProjectName = "subligo-web-app",
  [string]$TargetProjectName = "v0-subligo",
  [string]$ProjectScope = "darwins-projects-052af53a",
  [string]$PrimaryDomain = "https://www.subligo.hn"
)

$ErrorActionPreference = "Stop"

function Get-VercelSession {
  $authPath = Join-Path $HOME "AppData\Roaming\com.vercel.cli\Data\auth.json"
  $configPath = Join-Path $HOME "AppData\Roaming\com.vercel.cli\Data\config.json"

  if (!(Test-Path $authPath)) {
    throw "[vercel] No se encontro auth.json de la CLI de Vercel."
  }

  if (!(Test-Path $configPath)) {
    throw "[vercel] No se encontro config.json de la CLI de Vercel."
  }

  $auth = Get-Content $authPath -Raw | ConvertFrom-Json
  $config = Get-Content $configPath -Raw | ConvertFrom-Json

  if ([string]::IsNullOrWhiteSpace($auth.token)) {
    throw "[vercel] No hay token activo en la CLI de Vercel."
  }

  $teamId = if ([string]::IsNullOrWhiteSpace($config.currentTeam)) { $null } else { $config.currentTeam }
  if ([string]::IsNullOrWhiteSpace($teamId)) {
    throw "[vercel] No hay team activo en la CLI de Vercel."
  }

  return @{
    Token = $auth.token
    TeamId = $teamId
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

function Find-Project {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Session,
    [Parameter(Mandatory = $true)][string]$ProjectName
  )

  return Invoke-VercelApi -Session $Session -Method Get -Path "/v9/projects/$ProjectName?teamId=$($Session.TeamId)"
}

function Set-RootProjectLink {
  param(
    [Parameter(Mandatory = $true)][string]$RepoRoot,
    [Parameter(Mandatory = $true)][string]$ProjectId,
    [Parameter(Mandatory = $true)][string]$ProjectName,
    [Parameter(Mandatory = $true)][string]$OrgId
  )

  $vercelDir = Join-Path $RepoRoot ".vercel"
  New-Item -ItemType Directory -Path $vercelDir -Force | Out-Null

  $projectJson = @{
    projectId = $ProjectId
    orgId = $OrgId
    projectName = $ProjectName
  } | ConvertTo-Json -Compress

  Set-Content -LiteralPath (Join-Path $vercelDir "project.json") -Value $projectJson

  $readme = @"
> Why do I have a folder named ".vercel" in my project?
The ".vercel" folder is created when you link a directory to a Vercel Project.

> What does the "project.json" file contain?
The "project.json" file contains:
- The ID of the Vercel project that you linked ("projectId")
- The ID of the user or team your Vercel project is owned by ("orgId")

> Should I commit the ".vercel" folder?
No, you should not share the ".vercel" folder with anyone.
Upon creation, it will be automatically added to your ".gitignore" file.
"@

  Set-Content -LiteralPath (Join-Path $vercelDir "README.txt") -Value $readme
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$pushEnvScript = Join-Path $PSScriptRoot "push-web-env-to-vercel.ps1"
$deployScript = Join-Path $PSScriptRoot "deploy-web-vercel.ps1"

if (!(Test-Path $pushEnvScript)) {
  throw "[migrate] No existe $pushEnvScript"
}

if (!(Test-Path $deployScript)) {
  throw "[migrate] No existe $deployScript"
}

$session = Get-VercelSession

Write-Host "[migrate] Leyendo configuracion del proyecto fuente $SourceProjectName..."
$sourceProject = Find-Project -Session $session -ProjectName $SourceProjectName

Write-Host "[migrate] Leyendo configuracion del proyecto destino $TargetProjectName..."
$targetProject = Find-Project -Session $session -ProjectName $TargetProjectName

$projectSettings = @{
  framework = $sourceProject.framework
  rootDirectory = $sourceProject.rootDirectory
  sourceFilesOutsideRootDirectory = $sourceProject.sourceFilesOutsideRootDirectory
  installCommand = $sourceProject.installCommand
  buildCommand = $sourceProject.buildCommand
  outputDirectory = $sourceProject.outputDirectory
  devCommand = $sourceProject.devCommand
  nodeVersion = $sourceProject.nodeVersion
}

Write-Host "[migrate] Replicando settings de Vercel en $TargetProjectName..."
$null = Invoke-VercelApi -Session $session -Method Patch -Path "/v9/projects/$TargetProjectName?teamId=$($session.TeamId)" -Body $projectSettings

Write-Host "[migrate] Copiando variables de entorno de produccion..."
$sourceEnvs = Invoke-VercelApi -Session $session -Method Get -Path "/v10/projects/$SourceProjectName/env?teamId=$($session.TeamId)&decrypt=true"
$sourceEnvItems = if ($sourceEnvs -is [System.Array]) { @($sourceEnvs) } elseif ($null -ne $sourceEnvs.envs) { @($sourceEnvs.envs) } else { @($sourceEnvs) }
$productionEnvs = @($sourceEnvItems | Where-Object {
  $_.target -contains "production" -and $_.type -ne "system"
})

if ($productionEnvs.Count -gt 0) {
  $payload = foreach ($envVar in $productionEnvs) {
    @{
      key = $envVar.key
      value = $envVar.value
      target = @("production")
      type = if ($envVar.type -eq "secret") { "encrypted" } else { $envVar.type }
    }
  }

  $null = Invoke-VercelApi -Session $session -Method Post -Path "/v10/projects/$TargetProjectName/env?teamId=$($session.TeamId)&upsert=true" -Body $payload
}

Write-Host "[migrate] Verificando dominios del proyecto destino..."
$domainsResponse = Invoke-VercelApi -Session $session -Method Get -Path "/v9/projects/$TargetProjectName/domains?teamId=$($session.TeamId)"
$domainNames = @($domainsResponse.domains | ForEach-Object { $_.name })
$primaryDomainHost = ([Uri]$PrimaryDomain).Host
if ($domainNames -contains $primaryDomainHost) {
  Write-Host "[migrate] Dominio confirmado en Vercel: $primaryDomainHost"
} else {
  Write-Warning "[migrate] El dominio $primaryDomainHost no aparece asociado a $TargetProjectName. El deploy seguira igual, pero conviene revisarlo en el dashboard."
}

Write-Host "[migrate] Actualizando enlace local del repo a $TargetProjectName..."
Set-RootProjectLink -RepoRoot $repoRoot -ProjectId $targetProject.id -ProjectName $TargetProjectName -OrgId $session.TeamId

Push-Location $repoRoot
try {
  Write-Host "[migrate] Sincronizando env vars del web en $TargetProjectName..."
  & powershell -ExecutionPolicy Bypass -File $pushEnvScript -ProjectName $TargetProjectName -ProjectScope $ProjectScope -WebUrl $PrimaryDomain
  if ($LASTEXITCODE -ne 0) {
    throw "[migrate] Fallo la sincronizacion de variables del web."
  }

  Write-Host "[migrate] Desplegando $TargetProjectName a produccion..."
  & powershell -ExecutionPolicy Bypass -File $deployScript -ProjectName $TargetProjectName -ProjectScope $ProjectScope -PrimaryUrl $PrimaryDomain
  if ($LASTEXITCODE -ne 0) {
    throw "[migrate] Fallo el deploy del web."
  }

  Write-Host "[migrate] Migracion completada."
  Write-Host "[migrate] Produccion: $PrimaryDomain"
  Write-Host "[migrate] Alias de Vercel: https://$TargetProjectName.vercel.app"
} finally {
  Pop-Location
}
