# PowerShell script to test TMDB connectivity.
# Optional: set $env:TMDB_BEARER_TOKEN to test an authorized endpoint (rate limits / 401 / 429).

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing TMDB API Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    Write-Host "1) Connectivity test (no token)..." -ForegroundColor Yellow
    $r0 = Invoke-WebRequest -Uri "https://api.themoviedb.org/" -TimeoutSec 10 -MaximumRedirection 0 -ErrorAction Stop
    Write-Host "SUCCESS! HTTPS reachable. HTTP Status: $($r0.StatusCode)" -ForegroundColor Green
    Write-Host ""

    if ($env:TMDB_BEARER_TOKEN) {
        Write-Host "2) Authorized test (Bearer token from env:TMDB_BEARER_TOKEN)..." -ForegroundColor Yellow
        $headers = @{ "Authorization" = ("Bearer " + $env:TMDB_BEARER_TOKEN) }
        $response = Invoke-WebRequest -Uri "https://api.themoviedb.org/3/genre/movie/list" -Headers $headers -TimeoutSec 10 -ErrorAction Stop
        Write-Host "SUCCESS! HTTP Status: $($response.StatusCode)" -ForegroundColor Green
        if ($response.Headers['X-RateLimit-Remaining']) { Write-Host "X-RateLimit-Remaining: $($response.Headers['X-RateLimit-Remaining'])" -ForegroundColor Cyan }
        if ($response.Headers['X-RateLimit-Reset']) { Write-Host "X-RateLimit-Reset: $($response.Headers['X-RateLimit-Reset'])" -ForegroundColor Cyan }
    } else {
        Write-Host "2) Authorized test skipped (TMDB_BEARER_TOKEN not set)." -ForegroundColor Yellow
        Write-Host "   Set it: `$env:TMDB_BEARER_TOKEN='YOUR_TOKEN_HERE'" -ForegroundColor Yellow
    }
    
} catch {
    $msg = $_.Exception.Message
    if ($msg -match "timeout|connect|Невозможно соединиться|Unable to connect") {
        Write-Host "ERROR: Network/connectivity problem (host cannot reach TMDB)" -ForegroundColor Red
        Write-Host $msg -ForegroundColor Yellow
    } else {
        Write-Host "ERROR: $msg" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
