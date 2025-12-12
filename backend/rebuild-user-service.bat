@echo off
echo ========================================
echo Rebuilding user-service JAR and Docker
echo ========================================
echo.

REM Build common-dto first
echo Building common-dto...
cd common-dto
call mvnw.cmd clean install -DskipTests
if %errorlevel% neq 0 (
    echo FAILED to build common-dto
    exit /b %errorlevel%
)
cd ..

echo.
echo Building user-service...
cd user-service
call mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 (
    echo FAILED to build user-service
    exit /b %errorlevel%
)
cd ..

echo.
echo Checking JAR file...
if exist "user-service\target\userservice.jar" (
    echo JAR file created successfully!
    dir "user-service\target\userservice.jar"
) else (
    echo ERROR: JAR file not found!
    exit /b 1
)

echo.
echo Rebuilding Docker image...
docker-compose build user-service

if %errorlevel% equ 0 (
    echo.
    echo Restarting user-service container...
    docker-compose up -d user-service
    echo.
    echo ========================================
    echo SUCCESS! user-service rebuilt and restarted
    echo ========================================
    echo.
    echo Check logs with:
    echo   docker logs user-service -f
) else (
    echo.
    echo FAILED to rebuild Docker image
    exit /b %errorlevel%
)
