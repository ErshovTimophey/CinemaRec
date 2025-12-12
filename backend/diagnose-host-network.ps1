$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Host Network Diagnosis (Windows)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Test-Endpoint {
  param(
    [string]$HostName,
    [int]$Port = 443
  )

  Write-Host "---- $HostName`:$Port ----" -ForegroundColor Yellow

  try {
    $dns = Resolve-DnsName $HostName -ErrorAction Stop | Where-Object { $_.IPAddress } | Select-Object -ExpandProperty IPAddress
    if ($dns) {
      Write-Host ("DNS: " + ($dns -join ", "))
    }
  } catch {
    Write-Host ("DNS ERROR: " + $_.Exception.Message) -ForegroundColor Red
  }

  try {
    $tnc = Test-NetConnection -ComputerName $HostName -Port $Port -WarningAction SilentlyContinue
    Write-Host ("TCP: " + ($(if ($tnc.TcpTestSucceeded) { "OK" } else { "FAILED" })))
  } catch {
    Write-Host ("TCP ERROR: " + $_.Exception.Message) -ForegroundColor Red
  }

  try {
    # We don't need TMDB token here. Any HTTPS response means TLS+route works.
    $uri = "https://$HostName/"
    $resp = Invoke-WebRequest -Uri $uri -TimeoutSec 10 -Method GET -MaximumRedirection 0 -ErrorAction Stop
    Write-Host ("HTTPS GET: HTTP " + $resp.StatusCode) -ForegroundColor Green
  } catch {
    $msg = $_.Exception.Message
    Write-Host ("HTTPS GET ERROR: " + $msg) -ForegroundColor Red
  }

  Write-Host ""
}

Write-Host "Testing general HTTPS reachability..." -ForegroundColor Cyan
Test-Endpoint -HostName "google.com" -Port 443
Test-Endpoint -HostName "one.one.one.one" -Port 443

Write-Host "Testing TMDB reachability (no token, just connectivity)..." -ForegroundColor Cyan
Test-Endpoint -HostName "api.themoviedb.org" -Port 443

Write-Host "Notes:" -ForegroundColor Cyan
Write-Host "- If Google/Cloudflare fail too: your PC cannot do outbound HTTPS (proxy/VPN/firewall/DNS)."
Write-Host "- If only TMDB fails: TMDB blocked on your network/ISP or by security software."
Write-Host "- If DNS works but TCP fails: firewall/VPN/ISP routing issue."
Write-Host ""

