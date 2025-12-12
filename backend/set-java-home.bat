@echo off
echo ========================================
echo Setting JAVA_HOME for CMD
echo ========================================
echo.

set JAVA_HOME_VALUE=C:\Program Files\Java\jdk-21.0.1

REM Verify Java exists
if not exist "%JAVA_HOME_VALUE%\bin\java.exe" (
    echo ERROR: Java not found at %JAVA_HOME_VALUE%
    echo.
    echo Please check if JDK is installed at:
    echo   C:\Program Files\Java\jdk-21.0.1
    exit /b 1
)

REM Set JAVA_HOME in current session
set JAVA_HOME=%JAVA_HOME_VALUE%

REM Set JAVA_HOME permanently using setx
echo Setting JAVA_HOME permanently...
setx JAVA_HOME "%JAVA_HOME_VALUE%" >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Could not set JAVA_HOME permanently.
    echo You may need to run as Administrator.
    echo.
    echo For current session only, JAVA_HOME is set to:
    echo   %JAVA_HOME_VALUE%
) else (
    echo SUCCESS! JAVA_HOME set permanently.
)

echo.
echo JAVA_HOME = %JAVA_HOME%
echo.

REM Add JAVA_HOME\bin to PATH for current session
set PATH=%JAVA_HOME%\bin;%PATH%

echo Testing Java:
"%JAVA_HOME%\bin\java.exe" -version
echo.

echo ========================================
echo IMPORTANT: 
echo ========================================
echo JAVA_HOME is now set in THIS CMD window.
echo.
echo To use JAVA_HOME in other CMD windows:
echo   1. Close and reopen CMD, OR
echo   2. Set JAVA_HOME manually in each window:
echo      set JAVA_HOME=C:\Program Files\Java\jdk-21.0.1
echo.
echo To add JAVA_HOME\bin to PATH permanently, run:
echo   setx PATH "%PATH%;%JAVA_HOME%\bin"
echo.
echo Now you can run rebuild.bat from statistics-service folder!
echo.
