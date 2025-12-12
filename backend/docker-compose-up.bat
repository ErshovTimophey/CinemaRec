@echo off
echo ========================================
echo Auto-building ALL JAR files before Docker
echo ========================================
echo.

REM Build all JARs using the unified script
call build-all-jars.bat
if %errorlevel% neq 0 (
    echo.
    echo FAILED to build JAR files
    echo Cannot proceed with Docker build
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Starting Docker Compose...
echo ========================================
echo.
docker-compose up --build -d

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! All services started
    echo ========================================
    echo.
    echo Services are running. Check status with:
    echo   docker-compose ps
    echo.
) else (
    echo.
    echo FAILED to start Docker Compose
    exit /b %errorlevel%
)
