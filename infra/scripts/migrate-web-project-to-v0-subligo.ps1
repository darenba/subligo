param(
  [string]$SourceProjectName = "subligo-web-app",
  [string]$SourceProjectId = "prj_LZRmaLGwSQRZwWuFBjTkjzQekFI0",
  [string]$TargetProjectName = "v0-subligo",
  [string]$TargetProjectId = "prj_Q3znI73uSNBjxVLZUxhzC9xikAt6",
  [string]$ProjectScope = "darwins-projects-052af53a",
  [string]$PrimaryDomain = "https://www.subligo.hn",
  [string]$SecondaryDomain = "https://subligo.hn"
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

function Get-HttpErrorDetails {
  param([Parameter(Mandatory = $true)]$ErrorRecord)

  $statusCode = $null
  $body = $null

  if ($ErrorRecord.Exception -and $ErrorRecord.Exception.Response) {
    try {
      $statusCode = [int]$ErrorRecord.Exception.Response.StatusCode
    } catch {
    }

    try {
      $stream = $ErrorRecord.Exception.Response.GetResponseStream()
      if ($stream) {
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        $reader.Close()
      }
    } catch {
    }
  }

  if ([string]::IsNullOrWhiteSpace($body) -and $ErrorRecord.ErrorDetails -and $ErrorRecord.ErrorDetails.Message) {
    $body = $ErrorRecord.ErrorDetails.Message
  }

  return @{
    StatusCode = $statusCode
    Body = $body
  }
}

function Invoke-VercelApiAllowNotFound {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Session,
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Path,
    [object]$Body
  )

  try {
    return Invoke-VercelApi -Session $Session -Method $Method -Path $Path -Body $Body
  } catch {
    $details = Get-HttpErrorDetails -ErrorRecord $_
    if ($details.StatusCode -eq 404 -or ($details.Body -match '"code"\s*:\s*"not_found"')) {
      return $null
    }

    throw
  }
}

function Get-Projects {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Session,
    [string]$Search
  )

  $path = "/v9/projects?teamId=$($Session.TeamId)&limit=100"
  if (-not [string]::IsNullOrWhiteSpace($Search)) {
    $path += "&search=$([Uri]::EscapeDataString($Search))"
  }

  $response = Invoke-VercelApi -Session $Session -Method Get -Path $path
  if ($null -ne $response.projects) { return @($response.projects) }
  if ($response -is [System.Array]) { return @($response) }
  return @($response)
}

function Get-ProjectInfo {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Session,
    [Parameter(Mandatory = $true)][string]$ProjectRef,
    [switch]$AllowNotFound
  )

  $path = "/v9/projects/$([Uri]::EscapeDataString($ProjectRef))?teamId=$($Session.TeamId)"
  if ($AllowNotFound) {
    return Invoke-VercelApiAllowNotFound -Session $Session -Method Get -Path $path
  }

  return Invoke-VercelApi -Session $Session -Method Get -Path $path
}

function Get-ProjectDomains {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Session,
    [Parameter(Mandatory = $true)][string]$ProjectRef
  )

  $response = Invoke-VercelApi -Session $Session -Method Get -Path "/v9/projects/$([Uri]::EscapeDataString($ProjectRef))/domains?teamId=$($Session.TeamId)"
  return @($response.domains)
}

function Get-ProjectEnvs {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Session,
    [Parameter(Mandatory = $true)][string]$ProjectRef
  )

  $response = Invoke-VercelApi -Session $Session -Method Get -Path "/v10/projects/$([Uri]::EscapeDataString($ProjectRef))/env?teamId=$($Session.TeamId)&decrypt=true"
  if ($response -is [System.Array]) { return @($response) }
  if ($null -ne $response.envs) { return @($response.envs) }
  return @($response)
}

function Resolve-Project {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Session,
    [Parameter(Mandatory = $true)][string]$Label,
    [string]$ProjectName,
    [string]$ProjectId
  )

  $candidates = New-Object System.Collections.ArrayList
  if (-not [string]::IsNullOrWhiteSpace($ProjectName)) {
    [void]$candidates.Add($ProjectName)
  }

  if (-not [string]::IsNullOrWhiteSpace($ProjectName)) {
    $matchingProjects = @(
      Get-Projects -Session $Session -Search $ProjectName |
        Where-Object { $_.name -eq $ProjectName }
    )

    foreach ($project in $matchingProjects) {
      if (-not [string]::IsNullOrWhiteSpace($project.id)) {
        [void]$candidates.Add($project.id)
      }
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($ProjectId)) {
    [void]$candidates.Add($ProjectId)
  }

  $tried = @()
  foreach ($candidate in @($candidates | Select-Object -Unique)) {
    $tried += $candidate
    $resolved = Get-ProjectInfo -Session $Session -ProjectRef $candidate -AllowNotFound
    if ($null -ne $resolved) {
      return $resolved
    }
  }

  throw "[audit] No se pudo resolver el proyecto $Label en Vercel. Referencias probadas: $($tried -join ', ')"
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

  $domainNames = @($Domains | ForEach-Object { $_.name })
  Write-Host "[audit] Proyecto: $ProjectName"
  Write-Host "  Repo/branch: $(Get-RepoSummary -Project $Project)"
  Write-Host "  Root directory: $(Get-SafeProjectValue -Project $Project -Name 'rootDirectory')"
  Write-Host "  Framework: $(Get-SafeProjectValue -Project $Project -Name 'framework')"
  Write-Host "  Install command: $(Get-SafeProjectValue -Project $Project -Name 'installCommand')"
  Write-Host "  Build command: $(Get-SafeProjectValue -Project $Project -Name 'buildCommand')"
  Write-Host "  Output directory: $(Get-SafeProjectValue -Project $Project -Name 'outputDirectory')"
  Write-Host "  Node version: $(Get-SafeProjectValue -Project $Project -Name 'nodeVersion')"
  Write-Host "  Dominios: $(if ($domainNames.Count -gt 0) { $domainNames -join ', ' } else { '(sin dominios)' })"
  Write-Host "  Variables: $(@($Envs | Where-Object { $_.type -ne 'system' }).Count)"
}

function Show-AuditDifferences {
  param(
    [Parameter(Mandatory = $true)]$SourceProject,
    [Parameter(Mandatory = $true)]$TargetProject,
    [Parameter(Mandatory = $true)][object[]]$SourceDomains,
    [Parameter(Mandatory = $true)][object[]]$TargetDomains,
    [Parameter(Mandatory = $true)][object[]]$SourceEnvs,
    [Parameter(Mandatory = $true)][object[]]$TargetEnvs
  )

  Write-Host "[audit] Diferencias detectadas entre fuente y destino:"

  $differences = New-Object System.Collections.ArrayList
  foreach ($field in @("rootDirectory", "framework", "installCommand", "buildCommand", "outputDirectory", "nodeVersion", "sourceFilesOutsideRootDirectory", "enableAffectedProjectsDeployments")) {
    if ("$($SourceProject.$field)" -ne "$($TargetProject.$field)") {
      [void]$differences.Add("  - ${field}: fuente='$($SourceProject.$field)' | destino='$($TargetProject.$field)'")
    }
  }

  if ((Get-RepoSummary -Project $SourceProject) -ne (Get-RepoSummary -Project $TargetProject)) {
    [void]$differences.Add("  - repo/branch: fuente='$(Get-RepoSummary -Project $SourceProject)' | destino='$(Get-RepoSummary -Project $TargetProject)'")
  }

  $sourceDomainNames = @($SourceDomains | ForEach-Object { $_.name } | Sort-Object -Unique)
  $targetDomainNames = @($TargetDomains | ForEach-Object { $_.name } | Sort-Object -Unique)
  $missingDomains = @($sourceDomainNames | Where-Object { $_ -notin $targetDomainNames })
  if ($missingDomains.Count -gt 0) {
    [void]$differences.Add("  - dominios faltantes en destino: $($missingDomains -join ', ')")
  }

  $sourceEnvKeys = @($SourceEnvs | Where-Object { $_.type -ne 'system' } | ForEach-Object { $_.key } | Sort-Object -Unique)
  $targetEnvKeys = @($TargetEnvs | Where-Object { $_.type -ne 'system' } | ForEach-Object { $_.key } | Sort-Object -Unique)
  $missingEnvKeys = @($sourceEnvKeys | Where-Object { $_ -notin $targetEnvKeys })
  if ($missingEnvKeys.Count -gt 0) {
    [void]$differences.Add("  - variables faltantes en destino: $($missingEnvKeys -join ', ')")
  }

  if ($differences.Count -eq 0) {
    Write-Host "  - No se detectaron diferencias criticas."
    return
  }

  foreach ($line in $differences) {
    Write-Host $line
  }
}

function Sync-TargetProjectSettings {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Session,
    [Parameter(Mandatory = $true)][string]$TargetProjectRef,
    [Parameter(Mandatory = $true)]$SourceProject,
    [Parameter(Mandatory = $true)]$LocalWebConfig
  )

  $payload = @{
    framework = if ($SourceProject.framework) { $SourceProject.framework } else { $LocalWebConfig.framework }
    installCommand = if ($LocalWebConfig.installCommand) { $LocalWebConfig.installCommand } else { $SourceProject.installCommand }
    buildCommand = if ($LocalWebConfig.buildCommand) { $LocalWebConfig.buildCommand } else { $SourceProject.buildCommand }
    rootDirectory = $SourceProject.rootDirectory
    outputDirectory = $SourceProject.outputDirectory
    nodeVersion = $SourceProject.nodeVersion
    devCommand = $SourceProject.devCommand
    commandForIgnoringBuildStep = $SourceProject.commandForIgnoringBuildStep
    sourceFilesOutsideRootDirectory = $SourceProject.sourceFilesOutsideRootDirectory
    enableAffectedProjectsDeployments = $SourceProject.enableAffectedProjectsDeployments
  }

  Write-Host "[sync] Alineando settings de Vercel en $TargetProjectRef..."
  $null = Invoke-VercelApi -Session $Session -Method Patch -Path "/v9/projects/$([Uri]::EscapeDataString($TargetProjectRef))?teamId=$($Session.TeamId)" -Body $payload
}

function Sync-TargetEnvVars {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Session,
    [Parameter(Mandatory = $true)][string]$SourceProjectRef,
    [Parameter(Mandatory = $true)][string]$TargetProjectRef
  )

  $sourceEnvs = Get-ProjectEnvs -Session $Session -ProjectRef $SourceProjectRef
  $copyable = @($sourceEnvs | Where-Object { $_.type -ne "system" })

  if ($copyable.Count -eq 0) {
    Write-Warning "[sync] No se encontraron variables copiables en $SourceProjectRef."
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

  Write-Host "[sync] Copiando variables del proyecto fuente hacia $TargetProjectRef..."
  $null = Invoke-VercelApi -Session $Session -Method Post -Path "/v10/projects/$([Uri]::EscapeDataString($TargetProjectRef))/env?teamId=$($Session.TeamId)&upsert=true" -Body $payload
}

function Find-DomainEntry {
  param(
    [Parameter(Mandatory = $true)][object[]]$Domains,
    [Parameter(Mandatory = $true)][string]$DomainName
  )

  return @($Domains | Where-Object { $_.name -eq $DomainName } | Select-Object -First 1)[0]
}

function Sync-TargetDomainConfig {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Session,
    [Parameter(Mandatory = $true)][string]$TargetProjectRef,
    [Parameter(Mandatory = $true)][string]$DomainName,
    $SourceDomain
  )

  if ($null -eq $SourceDomain) {
    return
  }

  $payload = @{
    gitBranch = $SourceDomain.gitBranch
    redirect = $SourceDomain.redirect
    redirectStatusCode = $SourceDomain.redirectStatusCode
  }

  $null = Invoke-VercelApi -Session $Session -Method Patch -Path "/v9/projects/$([Uri]::EscapeDataString($TargetProjectRef))/domains/$([Uri]::EscapeDataString($DomainName))?teamId=$($Session.TeamId)" -Body $payload
}

function Ensure-TargetDomains {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Session,
    [Parameter(Mandatory = $true)]$SourceProject,
    [Parameter(Mandatory = $true)]$TargetProject,
    [Parameter(Mandatory = $true)][object[]]$SourceDomains,
    [Parameter(Mandatory = $true)][object[]]$TargetDomains,
    [Parameter(Mandatory = $true)][string[]]$DomainNames
  )

  foreach ($domainName in $DomainNames) {
    if ([string]::IsNullOrWhiteSpace($domainName)) {
      continue
    }

    $sourceDomain = Find-DomainEntry -Domains $SourceDomains -DomainName $domainName
    $targetDomain = Find-DomainEntry -Domains $TargetDomains -DomainName $domainName

    if ($null -ne $targetDomain) {
      Write-Host "[sync] El dominio $domainName ya esta asignado a $($TargetProject.name)."
      Sync-TargetDomainConfig -Session $Session -TargetProjectRef $TargetProject.id -DomainName $domainName -SourceDomain $sourceDomain
      continue
    }

    if ($null -ne $sourceDomain -and $sourceDomain.projectId -and $sourceDomain.projectId -ne $TargetProject.id) {
      Write-Host "[sync] Moviendo $domainName hacia $($TargetProject.name)..."
      $body = @{
        projectId = $TargetProject.id
        gitBranch = $sourceDomain.gitBranch
        redirect = $sourceDomain.redirect
        redirectStatusCode = $sourceDomain.redirectStatusCode
      }

      $null = Invoke-VercelApi -Session $Session -Method Post -Path "/v1/projects/$([Uri]::EscapeDataString($sourceDomain.projectId))/domains/$([Uri]::EscapeDataString($domainName))/move?teamId=$($Session.TeamId)" -Body $body
      continue
    }

    Write-Host "[sync] Agregando $domainName a $($TargetProject.name)..."
    $body = @{
      name = $domainName
    }
    $null = Invoke-VercelApi -Session $Session -Method Post -Path "/v10/projects/$([Uri]::EscapeDataString($TargetProject.id))/domains?teamId=$($Session.TeamId)" -Body $body
    Sync-TargetDomainConfig -Session $Session -TargetProjectRef $TargetProject.id -DomainName $domainName -SourceDomain $sourceDomain
  }
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
  $sourceProject = Resolve-Project -Session $session -Label "fuente" -ProjectName $SourceProjectName -ProjectId $SourceProjectId
  $targetProject = Resolve-Project -Session $session -Label "destino" -ProjectName $TargetProjectName -ProjectId $TargetProjectId
  $sourceDomains = Get-ProjectDomains -Session $session -ProjectRef $sourceProject.id
  $targetDomains = Get-ProjectDomains -Session $session -ProjectRef $targetProject.id
  $sourceEnvs = Get-ProjectEnvs -Session $session -ProjectRef $sourceProject.id
  $targetEnvs = Get-ProjectEnvs -Session $session -ProjectRef $targetProject.id

  Write-Host "[migrate] Migrando el web desde $($sourceProject.name) hacia $($targetProject.name)..."
  Write-Host "[migrate] El proyecto destino se publicara en $PrimaryDomain y en https://$($targetProject.name).vercel.app"
  Write-Host "[migrate] Usando la sesion autenticada del CLI de Vercel para evitar el token vencido de la REST API."

  Write-Host "[audit] Resumen del proyecto fuente:"
  Show-AuditSummary -ProjectName $sourceProject.name -Project $sourceProject -Domains $sourceDomains -Envs $sourceEnvs
  Write-Host "[audit] Resumen del proyecto destino:"
  Show-AuditSummary -ProjectName $targetProject.name -Project $targetProject -Domains $targetDomains -Envs $targetEnvs
  Show-AuditDifferences -SourceProject $sourceProject -TargetProject $targetProject -SourceDomains $sourceDomains -TargetDomains $targetDomains -SourceEnvs $sourceEnvs -TargetEnvs $targetEnvs

  Sync-TargetProjectSettings -Session $session -TargetProjectRef $targetProject.id -SourceProject $sourceProject -LocalWebConfig $localWebConfig
  Sync-TargetEnvVars -Session $session -SourceProjectRef $sourceProject.id -TargetProjectRef $targetProject.id
  Ensure-TargetDomains -Session $session -SourceProject $sourceProject -TargetProject $targetProject -SourceDomains $sourceDomains -TargetDomains $targetDomains -DomainNames @(
    ([Uri]$PrimaryDomain).Host,
    ([Uri]$SecondaryDomain).Host
  )

  Write-Host "[migrate] Sincronizando variables de entorno del web en $($targetProject.name)..."
  & powershell -ExecutionPolicy Bypass -File $pushEnvScript `
    -ProjectName $targetProject.name `
    -ProjectScope $ProjectScope `
    -WebUrl $PrimaryDomain
  if ($LASTEXITCODE -ne 0) {
    throw "[migrate] Fallo la sincronizacion de variables del web."
  }

  Write-Host "[migrate] Construyendo y desplegando el web en $($targetProject.name)..."
  & powershell -ExecutionPolicy Bypass -File $deployScript `
    -ProjectName $targetProject.name `
    -ProjectScope $ProjectScope `
    -PrimaryUrl $PrimaryDomain `
    -SecondaryUrl $SecondaryDomain
  if ($LASTEXITCODE -ne 0) {
    throw "[migrate] Fallo el deploy del web."
  }

  Write-Host "[migrate] Migracion completada."
  Write-Host "[migrate] Produccion: $PrimaryDomain"
  Write-Host "[migrate] Alias de Vercel: https://$($targetProject.name).vercel.app"
} finally {
  Pop-Location
}
