param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Arguments
)

$ErrorActionPreference = 'Stop'

$pnpm = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
if (-not $pnpm) {
  $pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
}

if ($pnpm) {
  & $pnpm.Source @Arguments
  exit $LASTEXITCODE
}

$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npm) {
  $npm = Get-Command npm -ErrorAction SilentlyContinue
}

if (-not $npm) {
  throw 'No se encontro pnpm ni npm. Instala Node.js 20+ con npm habilitado.'
}

& $npm.Source exec --yes pnpm@10.6.2 -- @Arguments
exit $LASTEXITCODE
