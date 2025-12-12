@echo off
echo ========================================
echo Searching for Java installation...
echo ========================================
echo.

REM Check if java is in PATH
where java >nul 2>&1
if %errorlevel% equ 0 (
    echo Java found in PATH:
    where java
    echo.
    
    REM Try to find JAVA_HOME from java.exe location
    for /f "tokens=*" %%i in ('where java') do (
        set JAVA_EXE=%%i
    )
    echo Java executable: %JAVA_EXE%
    
    REM Remove \bin\java.exe to get JAVA_HOME
    for %%i in ("%JAVA_EXE%") do set JAVA_HOME_CALC=%%~dpi
    for %%i in ("%JAVA_HOME_CALC%") do set JAVA_HOME_CALC=%%~dpi
    
    echo.
    echo Calculated JAVA_HOME: %JAVA_HOME_CALC%
    echo.
) else (
    echo Java NOT found in PATH
    echo.
)

REM Check common Java installation locations
echo Checking common Java installation directories...
echo.

set "JAVA_PATHS[0]=C:\Program Files\Java"
set "JAVA_PATHS[1]=C:\Program Files (x86)\Java"
set "JAVA_PATHS[2]=C:\Program Files\Eclipse Adoptium"
set "JAVA_PATHS[3]=C:\Program Files\Microsoft"
set "JAVA_PATHS[4]=%LOCALAPPDATA%\Programs\Eclipse Adoptium"
set "JAVA_PATHS[5]=C:\OpenJDK"
set "JAVA_PATHS[6]=%USERPROFILE%\AppData\Local\Programs\Eclipse Adoptium"

for /L %%i in (0,1,6) do (
    set /a idx=%%i
    call set "CHECK_PATH=%%JAVA_PATHS[!idx!]%%"
    if exist "!CHECK_PATH!" (
        echo Found directory: !CHECK_PATH!
        dir /b /ad "!CHECK_PATH!" 2>nul | findstr /i "jdk java" >nul
        if %errorlevel% equ 0 (
            echo   Contents:
            for /d %%d in ("!CHECK_PATH!\*") do (
                set "DIR_NAME=%%~nd"
                echo     - %%d
                if exist "%%d\bin\java.exe" (
                    echo       ^> Java executable found!
                    echo       ^> JAVA_HOME should be: %%d
                )
            )
            echo.
        )
    )
)

echo.
echo ========================================
echo Manual check instructions:
echo ========================================
echo.
echo 1. Open File Explorer
echo 2. Navigate to: C:\Program Files\Java
echo    (or C:\Program Files (x86)\Java)
echo    (or C:\Program Files\Eclipse Adoptium)
echo 3. Look for folders like:
echo    - jdk-17
echo    - jdk1.8.0_xxx
echo    - jdk-17.0.x.x-hotspot
echo.
echo 4. Inside the JDK folder should be:
echo    - bin\java.exe
echo    - lib\
echo    - jre\
echo.
echo 5. The JAVA_HOME path should be the JDK folder itself
echo    Example: C:\Program Files\Java\jdk-17
echo.
echo ========================================
echo Current JAVA_HOME (if set):
echo ========================================
if defined JAVA_HOME (
    echo JAVA_HOME=%JAVA_HOME%
    if exist "%JAVA_HOME%\bin\java.exe" (
        echo ^> Valid! Java found at: %JAVA_HOME%\bin\java.exe
        "%JAVA_HOME%\bin\java.exe" -version
    ) else (
        echo ^> Invalid! java.exe not found at %JAVA_HOME%\bin\java.exe
    )
) else (
    echo JAVA_HOME is NOT set
)
echo.
