@echo off
echo ========================================
echo Diagnosing TMDB Network Connection Issue
echo ========================================
echo.

echo 1. Checking Docker network configuration...
echo.
docker network inspect backend_app_network --format "{{.Driver}} - {{.Name}}"
echo.

echo 2. Testing from host machine (no token needed)...
echo.
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'https://api.themoviedb.org/' -TimeoutSec 10 -MaximumRedirection 0; Write-Host ('HTTP ' + $r.StatusCode) } catch { Write-Host ('ERROR: ' + $_.Exception.Message) }"
echo.

echo 3. Checking if user-service container has internet access (uses Java)...
echo.
call "%~dp0test-container-internet.bat"
echo.

echo ========================================
echo Diagnosis Summary
echo ========================================
echo.
echo If DNS fails: Docker DNS configuration issue
echo If ping fails: Container cannot reach internet
echo If only TMDB fails: TMDB might be blocked or unreachable from your network
echo.
echo Possible solutions:
echo   1. Check Docker network settings
echo   2. Check firewall/proxy settings
echo   3. Check if TMDB API is accessible from your network
echo   4. Try using host network mode (not recommended for production)
echo.
