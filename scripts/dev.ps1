$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "Dorham root: $Root" -ForegroundColor Cyan

if (-not (Test-Path "$Root\package.json")) {
  throw "package.json not found. This script must live in the Dorham repo."
}

if (-not (Test-Path "$Root\node_modules")) {
  Write-Host "Installing npm packages..." -ForegroundColor Yellow
  npm install
}

$pgReady = $false
try {
  $tcp = New-Object System.Net.Sockets.TcpClient
  $tcp.Connect("127.0.0.1", 5432)
  $tcp.Close()
  $pgReady = $true
} catch {
  $pgReady = $false
}

if (-not $pgReady) {
  Write-Host "Starting local Postgres (no Docker required)..." -ForegroundColor Yellow
  Start-Process -FilePath "node" -ArgumentList "scripts/local-postgres.mjs" -WorkingDirectory $Root -WindowStyle Minimized
  $deadline = (Get-Date).AddSeconds(90)
  do {
    Start-Sleep -Seconds 2
    try {
      $tcp = New-Object System.Net.Sockets.TcpClient
      $tcp.Connect("127.0.0.1", 5432)
      $tcp.Close()
      $pgReady = $true
    } catch {
      $pgReady = $false
    }
  } while (-not $pgReady -and (Get-Date) -lt $deadline)
}

if (-not $pgReady) {
  throw "Postgres did not start on port 5432. Open another terminal in this folder and run: npm run db:up"
}

npm run db:generate
npm run db:migrate
npm run db:seed
Write-Host "Starting API + website..." -ForegroundColor Cyan
npm run dev
