@echo off
echo Building JAR files using Docker...
echo.

REM Get current directory
set BACKEND_PATH=%~dp0

REM Try different Maven images in order of preference
set MAVEN_IMAGE=maven:3.8-openjdk-17-slim
echo Checking for Maven image: %MAVEN_IMAGE%
docker images --format "{{.Repository}}:{{.Tag}}" | findstr /C:"maven" >nul 2>&1
if %errorlevel% equ 0 (
    echo Found existing Maven image, using: %MAVEN_IMAGE%
) else (
    echo Maven image not found locally, will try to pull: %MAVEN_IMAGE%
    echo If pull fails, you may need to check internet connection or use local Maven.
)

echo.
echo Building common-dto...
docker run --rm -v "%BACKEND_PATH%common-dto:/app" -w /app %MAVEN_IMAGE% mvn clean install -DskipTests
if %errorlevel% neq 0 (
    echo.
    echo Trying alternative: maven:3.8-openjdk-17...
    set MAVEN_IMAGE=maven:3.8-openjdk-17
    docker run --rm -v "%BACKEND_PATH%common-dto:/app" -w /app %MAVEN_IMAGE% mvn clean install -DskipTests
    if %errorlevel% neq 0 (
        echo.
        echo FAILED to build common-dto
        echo.
        echo Possible solutions:
        echo   1. Check internet connection
        echo   2. Pull Maven image manually: docker pull %MAVEN_IMAGE%
        echo   3. Use local Maven (set JAVA_HOME and use rebuild.bat)
        exit /b %errorlevel%
    )
)

echo.
echo Building statistics-service...

REM Copy common-dto JAR to local Maven repo for statistics-service to use
set LOCAL_REPO=%USERPROFILE%\.m2\repository\com\example\common-dto\1.0-SNAPSHOT
if not exist "%LOCAL_REPO%" mkdir "%LOCAL_REPO%"
if exist "%BACKEND_PATH%common-dto\target\common-dto-1.0-SNAPSHOT.jar" (
    copy "%BACKEND_PATH%common-dto\target\common-dto-1.0-SNAPSHOT.jar" "%LOCAL_REPO%\" /Y
) else (
    echo ERROR: common-dto JAR not found after build!
    exit /b 1
)

docker run --rm -v "%BACKEND_PATH%statistics-service:/app" -v "%LOCAL_REPO%:/root/.m2/repository/com/example/common-dto/1.0-SNAPSHOT" -w /app %MAVEN_IMAGE% mvn clean package -DskipTests
if %errorlevel% neq 0 (
    echo.
    echo FAILED to build statistics-service
    exit /b %errorlevel%
)

echo.
echo ========================================
echo SUCCESS! JAR files built successfully
echo ========================================
echo.
echo JAR location: %BACKEND_PATH%statistics-service\target\statisticsservice.jar
if exist "%BACKEND_PATH%statistics-service\target\statisticsservice.jar" (
    dir "%BACKEND_PATH%statistics-service\target\statisticsservice.jar"
    echo.
    echo Next steps:
    echo   1. docker-compose build statistics-service
    echo   2. docker-compose up -d statistics-service
) else (
    echo ERROR: JAR file not found!
    exit /b 1
)
