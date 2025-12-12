@echo off
echo ========================================
echo Building ALL JAR files for all services
echo ========================================
echo.

REM Check if JAVA_HOME is set
if "%JAVA_HOME%"=="" (
    echo WARNING: JAVA_HOME is not set!
    echo Try running: set-java-home.bat
    echo Or set JAVA_HOME manually: set JAVA_HOME=C:\Program Files\Java\jdk-21.0.1
    echo.
    pause
)

echo Current JAVA_HOME: %JAVA_HOME%
java -version
echo.

set BUILD_FAILED=0

REM Step 1: Build common-dto first (required by other services)
echo ========================================
echo Step 1: Building common-dto...
echo ========================================
cd common-dto
if %errorlevel% neq 0 (
    echo ERROR: Cannot find common-dto directory
    exit /b 1
)
call mvnw.cmd clean install -DskipTests
if %errorlevel% neq 0 (
    echo FAILED to build common-dto
    set BUILD_FAILED=1
) else (
    echo SUCCESS: common-dto built!
)
cd ..

if %BUILD_FAILED%==1 (
    echo.
    echo Cannot continue - common-dto build failed!
    exit /b 1
)

echo.

REM Step 2: Build all services in parallel (they don't depend on each other)
echo ========================================
echo Step 2: Building all services...
echo ========================================
echo.

REM List of services to build
set SERVICES=auth-service user-service statistics-service recommendation-service review-service image-storage-service quiz-service proxy-service

for %%S in (%SERVICES%) do (
    echo ----------------------------------------
    echo Building %%S...
    echo ----------------------------------------
    cd %%S
    if exist "pom.xml" (
        call mvnw.cmd clean package -DskipTests
        if %errorlevel% neq 0 (
            echo FAILED to build %%S
            set BUILD_FAILED=1
        ) else (
            echo SUCCESS: %%S built!
            if exist "target\*.jar" (
                echo   JAR file created in target\
                dir /b target\*.jar
            )
        )
    ) else (
        echo WARNING: pom.xml not found in %%S, skipping...
    )
    cd ..
    echo.
)

echo ========================================
echo Build Summary
echo ========================================
if %BUILD_FAILED%==1 (
    echo.
    echo WARNING: Some services failed to build!
    echo Please check the errors above.
    exit /b 1
) else (
    echo.
    echo SUCCESS! All JAR files built successfully!
    echo.
    echo JAR files location:
    for %%S in (%SERVICES%) do (
        if exist "%%S\target\*.jar" (
            echo   %%S\target\*.jar
        )
    )
    echo.
    echo Now you can run:
    echo   docker-compose up --build -d
    echo.
    echo Or use:
    echo   docker-compose-up.bat (auto-builds and starts)
)
