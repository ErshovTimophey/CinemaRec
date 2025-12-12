@echo off
echo ========================================
echo Testing Docker Container Network Access
echo ========================================
echo.

echo Testing if container can reach external HTTPS endpoint...
echo.

REM Test with wget or curl inside container (if available)
docker exec user-service sh -c "wget --spider --timeout=10 https://api.themoviedb.org/3 2>&1" 2>&1 | findstr /C:"200" /C:"401" /C:"timeout" /C:"failed" /C:"Unable"
echo.

REM Alternative: test Java can resolve DNS
docker exec user-service sh -c "java -cp /app/app.jar -e 'java.net.InetAddress.getByName(\"api.themoviedb.org\")'" 2>&1
echo.

REM Check if container can reach Google DNS
docker exec user-service ping -c 1 8.8.8.8 2>&1 | findstr /C:"1 packets" /C:"unreachable" /C:"timeout"
echo.

echo ========================================
echo Network Test Completed
echo ========================================
echo.
