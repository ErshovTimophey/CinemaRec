@echo off
echo ========================================
echo Checking JAR file location and version
echo ========================================
echo.

REM Check local JAR
echo Checking local JAR file...
if exist "statistics-service\target\statisticsservice.jar" (
    echo Local JAR found!
    dir "statistics-service\target\statisticsservice.jar"
    echo.
    echo Checking JAR contents (looking for StatisticsController)...
    jar -tf "statistics-service\target\statisticsservice.jar" | findstr "StatisticsController" >nul
    if %errorlevel% equ 0 (
        echo   StatisticsController found in JAR!
    ) else (
        echo   StatisticsController NOT found in JAR
    )
    echo.
) else (
    echo Local JAR NOT found at: statistics-service\target\statisticsservice.jar
    echo.
    echo You need to build JAR first:
    echo   cd statistics-service
    echo   rebuild.bat
    echo.
)

REM Check if Docker container is running
echo Checking Docker container...
docker ps --filter "name=statistics-service" --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" 2>nul
if %errorlevel% neq 0 (
    echo Docker is not running or statistics-service container not found
    echo.
) else (
    echo.
    REM Check Docker image
    echo Checking Docker container JAR...
    docker exec statistics-service ls -lh /app/app.jar 2>nul
    if %errorlevel% equ 0 (
        echo.
        echo Docker container JAR found!
    ) else (
        echo Docker container is not running or JAR not found inside.
    )
)
echo.
