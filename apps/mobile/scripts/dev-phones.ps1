$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" } |
  Select-Object -First 1 -ExpandProperty IPAddress)

if (-not $ip) { throw "LAN IP پیدا نشد. Wi-Fi یا Ethernet را چک کن." }

Write-Host "LAN $ip"
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
$env:EXPO_PUBLIC_API_URL = "http://${ip}:4000"

if (Test-Path $adb) {
  & $adb start-server
  $devices = & $adb devices
  Write-Host $devices
  if ($devices -match "device$") {
    & $adb reverse tcp:8081 tcp:8081
    & $adb reverse tcp:4000 tcp:4000
    Write-Host "adb reverse آماده است."
  } else {
    Write-Host "اندروید با USB debugging دیده نشد. Expo Go را روی همان Wi-Fi باز کن."
  }
}

Write-Host "iOS از ویندوز نصب نمی‌شود. روی آیفون Expo Go را باز کن و QR را بزن."
Set-Location $root
npx expo start --lan --port 8081
