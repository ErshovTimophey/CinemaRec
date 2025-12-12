@echo off
echo ========================================
echo Testing Container Internet Access
echo ========================================
echo.

echo This script uses Java inside the container (no curl/wget/ping needed).
echo.

echo 0. Sanity: container status
docker ps --filter "name=user-service" --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
echo.

echo 1. Copying NetTest.java into container...
docker cp "%~dp0tools\NetTest.java" user-service:/tmp/NetTest.java
if errorlevel 1 (
  echo FAILED: docker cp NetTest.java
  goto :end
)
echo.

echo 2. Compiling NetTest.java inside container...
docker exec user-service sh -c "javac /tmp/NetTest.java"
if errorlevel 1 (
  echo FAILED: javac inside container
  goto :end
)
echo.

echo 3. TCP/TLS to Google HTTPS (google.com:443)...
docker exec user-service sh -c "java -cp /tmp NetTest google.com 443 5000"
echo.

echo 4. TCP/TLS to Cloudflare HTTPS (one.one.one.one:443)...
docker exec user-service sh -c "java -cp /tmp NetTest one.one.one.one 443 5000"
echo.

echo 5. TCP/TLS to TMDB HTTPS (api.themoviedb.org:443)...
docker exec user-service sh -c "java -cp /tmp NetTest api.themoviedb.org 443 5000"
echo.

echo 6. Plain TCP to Google DNS (8.8.8.8:53)...
docker exec user-service sh -c "java -cp /tmp NetTest 8.8.8.8 53 3000"
echo.

echo ========================================
echo Results:
echo ========================================
echo.
echo If Google/Cloudflare/TMDB all fail = container has no outbound internet
echo If Google/Cloudflare work but TMDB fails = TMDB is blocked on your network/ISP
echo If only TLS fails (TCP ok, TLS error) = proxy/antivirus TLS inspection or broken cert store
echo.

:end
