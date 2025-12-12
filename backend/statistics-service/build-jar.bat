@echo off
echo Checking Java installation...

REM Try to find Java
where java >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java not found in PATH
    echo Please install Java 17 or set JAVA_HOME environment variable
    exit /b 1
)

REM Check Java version
java -version
echo.

REM Try to find Java installation directory
for /f "tokens=*" %%i in ('where java') do (
    set JAVA_EXE=%%i
)
echo Found Java at: %JAVA_EXE%

REM Try to set JAVA_HOME automatically (remove \bin\java)
for %%i in ("%JAVA_EXE%") do set JAVA_HOME=%%~dpi
for %%i in ("%JAVA_HOME%") do set JAVA_HOME=%%~dpi
echo Trying JAVA_HOME: %JAVA_HOME%

REM Build common-dto first
echo.
echo ========================================
echo Building common-dto...
echo ========================================
cd ..\common-dto
if not defined JAVA_HOME (
    echo WARNING: JAVA_HOME not set, using system Java
)
call mvnw.cmd clean install -DskipTests
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo FAILED to build common-dto
    echo ========================================
    echo.
    echo If you get JAVA_HOME error, try setting it manually:
    echo   set JAVA_HOME=C:\Program Files\Java\jdk-17
    echo   (replace with your actual Java path)
    exit /b %errorlevel%
)

REM Build statistics-service
echo.
echo ========================================
echo Building statistics-service...
echo ========================================
cd ..\statistics-service
call mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo FAILED to build statistics-service
    echo ========================================
    exit /b %errorlevel%
)

echo.
echo ========================================
echo SUCCESS! JAR file built successfully
echo ========================================
echo.
echo JAR location: target\statisticsservice.jar
if exist target\statisticsservice.jar (
    dir target\statisticsservice.jar
    echo.
    echo Next steps:
    echo   1. cd .. (go to backend directory)
    echo   2. docker-compose build statistics-service
    echo   3. docker-compose up -d statistics-service
)
