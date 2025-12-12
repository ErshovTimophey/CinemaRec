@echo off
echo ========================================
echo Testing TMDB API Status and Rate Limits
echo ========================================
echo.

echo 1. Testing TMDB connectivity from HOST (no token needed)...
echo.
echo Trying to reach https://api.themoviedb.org/ (expect 200/301/404 - any HTTP is OK)...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'https://api.themoviedb.org/' -TimeoutSec 10 -MaximumRedirection 0; Write-Host ('HTTP ' + $r.StatusCode) } catch { Write-Host ('ERROR: ' + $_.Exception.Message) }"
echo.

echo 2. (Optional) Testing authorized endpoint with Bearer token...
echo.
if "%TMDB_BEARER_TOKEN%"=="" (
  echo TMDB_BEARER_TOKEN is not set. Skipping authorized test.
  echo Set it like: set TMDB_BEARER_TOKEN=YOUR_TOKEN_HERE
) else (
  powershell -NoProfile -Command "try { $h=@{Authorization=('Bearer ' + $env:TMDB_BEARER_TOKEN)}; $r=Invoke-WebRequest -Uri 'https://api.themoviedb.org/3/genre/movie/list' -Headers $h -TimeoutSec 10; Write-Host ('HTTP ' + $r.StatusCode); if($r.Headers['X-RateLimit-Remaining']){Write-Host ('X-RateLimit-Remaining: ' + $r.Headers['X-RateLimit-Remaining'])} } catch { if($_.Exception.Response -and $_.Exception.Response.StatusCode){Write-Host ('HTTP ' + [int]$_.Exception.Response.StatusCode)}; Write-Host ('ERROR: ' + $_.Exception.Message) }"
)
echo.

echo ========================================
echo Test Results Interpretation
echo ========================================
echo.
echo HTTP Status codes:
echo   200 = OK, API works fine
echo   401 = Unauthorized (wrong or expired token)
echo   429 = Too Many Requests (rate limit exceeded - wait 10 seconds)
echo.
echo Common issues:
echo   - 429 = You've hit the rate limit (40 requests per 10 seconds)
echo   - 401 = Your API token might be invalid or expired
echo   - Connection timeout = Network issue (Docker cannot reach API)
echo.
