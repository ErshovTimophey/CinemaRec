@echo off
echo ========================================
echo Testing TMDB API Connection
echo ========================================
echo.

echo 1. Testing from HOST machine (no token needed)...
echo.
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'https://api.themoviedb.org/' -TimeoutSec 10 -MaximumRedirection 0; Write-Host ('HTTP ' + $r.StatusCode) } catch { Write-Host ('ERROR: ' + $_.Exception.Message) }"
echo.

echo 2. Testing connectivity from Docker container (uses Java)...
echo.
call "%~dp0test-container-internet.bat"
echo.

echo 3. Checking if user-service container is running...
echo.
docker ps --filter "name=user-service" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo 4. Checking recent logs for TMDB errors...
echo.
docker logs user-service --tail 20 2>&1 | findstr /C:"tmdb" /C:"TMDB" /C:"timeout" /C:"timeout" /C:"Connection" /C:"error" /C:"Error" /i
echo.

echo ========================================
echo Test completed
echo ========================================
echo.
echo Analysis:
echo   - HTTP 401 from host = TMDB API is accessible (401 is expected with wrong API key)
echo   - If ping fails = DNS or network issue
echo   - Check logs above for specific errors
echo.
