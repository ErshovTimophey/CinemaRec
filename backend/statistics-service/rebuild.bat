@echo off
echo Current directory: %CD%
echo.
echo Building common-dto...
cd ..\common-dto
if %errorlevel% neq 0 (
    echo ERROR: Cannot find common-dto directory
    exit /b 1
)
call mvnw.cmd clean install -DskipTests
if %errorlevel% neq 0 (
    echo Failed to build common-dto
    exit /b %errorlevel%
)

echo.
echo Building statistics-service...
cd ..\statistics-service
if %errorlevel% neq 0 (
    echo ERROR: Cannot find statistics-service directory
    exit /b 1
)
call mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 (
    echo Failed to build statistics-service
    exit /b %errorlevel%
)

echo.
echo Checking JAR file...
if exist target\statisticsservice.jar (
    echo JAR file exists: target\statisticsservice.jar
    dir target\statisticsservice.jar
    echo.
    echo JAR file size and date:
    for %%F in (target\statisticsservice.jar) do (
        echo   Size: %%~zF bytes
        echo   Date: %%~tF
    )
) else (
    echo ERROR: JAR file not found!
    exit /b 1
)

echo.
echo Build completed successfully!
echo.
echo Now run from backend directory:
echo   docker-compose build --no-cache statistics-service
echo   docker-compose up -d statistics-service
