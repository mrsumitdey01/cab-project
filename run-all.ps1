param(
  [switch]$NoInstall
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) {
  Write-Host "[run-all] $msg"
}

Write-Info "Starting full stack (server + client)"

if (-not $NoInstall) {
  Write-Info "Installing server dependencies"
  Push-Location "$PSScriptRoot\server"
  npm install
  Write-Info "Running server index migration"
  npm run migrate:indexes
  Write-Info "Seeding admin (no-op if already exists)"
  npm run seed-admin
  Pop-Location

  Write-Info "Installing client dependencies"
  Push-Location "$PSScriptRoot\client"
  npm install
  Pop-Location
} else {
  Write-Info "Skipping installs (--NoInstall)"
}

Write-Info "Launching server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$PSScriptRoot\server`"; npm run dev"

Write-Info "Launching client"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$PSScriptRoot\client`"; npm start"

Write-Info "Done. Two terminals opened for server and client."
