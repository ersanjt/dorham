# Verify Dorham public DNS/TLS before inviting people.
# Usage: powershell -File scripts/verify-public.ps1

$ErrorActionPreference = "Continue"
$checks = @(
  @{ Name = "www health"; Url = "https://www.dorham.app/v1/health"; ExpectJson = $true },
  @{ Name = "apex health"; Url = "https://dorham.app/v1/health"; ExpectJson = $true },
  @{ Name = "api health"; Url = "https://api.dorham.app/v1/health"; ExpectJson = $true },
  @{ Name = "hang-plans"; Url = "https://www.dorham.app/v1/venues/hang-plans?city=istanbul&limit=1"; ExpectJson = $true }
)

function Resolve-A([string]$hostName) {
  try {
    return [System.Net.Dns]::GetHostAddresses($hostName) | ForEach-Object { $_.IPAddressToString }
  } catch {
    return @()
  }
}

Write-Host "== DNS =="
foreach ($h in @("dorham.app", "www.dorham.app", "api.dorham.app", "vpn.dorham.app")) {
  $ips = Resolve-A $h
  $joined = if ($ips.Count) { $ips -join ", " } else { "(none)" }
  $bad = $ips -contains "92.205.182.99" -and $h -ne "vpn.dorham.app"
  if ($bad) {
    Write-Host "FAIL  $h -> $joined  (must NOT be VPS; delete A @ in Cloudflare)" -ForegroundColor Red
  } elseif ($h -eq "vpn.dorham.app" -and ($ips -contains "92.205.182.99")) {
    Write-Host "OK    $h -> $joined  (Vira VPN)" -ForegroundColor Green
  } else {
    Write-Host "INFO  $h -> $joined"
  }
}

Write-Host ""
Write-Host "== HTTPS =="
foreach ($c in $checks) {
  try {
    $res = Invoke-WebRequest -Uri $c.Url -UseBasicParsing -TimeoutSec 20
    $body = $res.Content
    $ok = $res.StatusCode -eq 200
    if ($c.ExpectJson) {
      $ok = $ok -and ($body -match '"ok"\s*:\s*true' -or $body -match '"data"')
    }
    if ($ok) {
      Write-Host ("OK    {0}  {1}" -f $c.Name, $c.Url) -ForegroundColor Green
    } else {
      Write-Host ("FAIL  {0}  status={1} body={2}" -f $c.Name, $res.StatusCode, $body.Substring(0, [Math]::Min(120, $body.Length))) -ForegroundColor Red
    }
  } catch {
    Write-Host ("FAIL  {0}  {1}" -f $c.Name, $_.Exception.Message) -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "If apex FAIL with CERT_COMMON_NAME_INVALID: Cloudflare DNS delete A @ -> 92.205.182.99 and map dorham.app on the Tunnel."
