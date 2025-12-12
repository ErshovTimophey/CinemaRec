# PowerShell script to set JAVA_HOME permanently

$javaHome = "C:\Program Files\Java\jdk-21.0.1"

Write-Host "Setting JAVA_HOME to: $javaHome" -ForegroundColor Cyan

# Verify Java exists at this path
if (-not (Test-Path "$javaHome\bin\java.exe")) {
    Write-Host "ERROR: Java not found at $javaHome" -ForegroundColor Red
    exit 1
}

# Set JAVA_HOME in current session
$env:JAVA_HOME = $javaHome

# Add JAVA_HOME to PATH if not already there
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$javaHome\bin*") {
    Write-Host "Adding $javaHome\bin to PATH..." -ForegroundColor Yellow
    $newPath = "$currentPath;$javaHome\bin"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
}

# Set JAVA_HOME permanently for current user
[Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")

Write-Host "`nSUCCESS! JAVA_HOME set permanently" -ForegroundColor Green
Write-Host "JAVA_HOME = $javaHome" -ForegroundColor Yellow
Write-Host "`nTo apply changes in current session, restart PowerShell or run:" -ForegroundColor Cyan
Write-Host '  $env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.1"' -ForegroundColor White

# Test Java
Write-Host "`nTesting Java:" -ForegroundColor Cyan
& "$javaHome\bin\java.exe" -version
