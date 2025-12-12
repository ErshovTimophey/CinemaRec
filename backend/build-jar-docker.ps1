# PowerShell script to build JAR using Docker
# Usage: .\build-jar-docker.ps1

Write-Host "Building JAR files using Docker..." -ForegroundColor Green

$backendPath = Get-Location
if (-not (Test-Path "common-dto")) {
    Write-Host "ERROR: Must run from backend directory" -ForegroundColor Red
    exit 1
}

# Build common-dto
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Building common-dto..." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$commonDtoPath = Join-Path $backendPath "common-dto"
docker run --rm `
    -v "${commonDtoPath}:/app" `
    -w /app `
    maven:3.9-eclipse-temurin-17 `
    mvn clean install -DskipTests

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nFAILED to build common-dto" -ForegroundColor Red
    exit 1
}

# Build statistics-service
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Building statistics-service..." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$statsServicePath = Join-Path $backendPath "statistics-service"

# First, copy common-dto JAR to local Maven repo location
$localRepo = Join-Path $env:USERPROFILE ".m2\repository\com\example\common-dto\1.0-SNAPSHOT"
New-Item -ItemType Directory -Force -Path $localRepo | Out-Null
Copy-Item "$commonDtoPath\target\common-dto-1.0-SNAPSHOT.jar" "$localRepo\" -Force

docker run --rm `
    -v "${statsServicePath}:/app" `
    -v "${localRepo}:/root/.m2/repository/com/example/common-dto/1.0-SNAPSHOT" `
    -w /app `
    maven:3.9-eclipse-temurin-17 `
    mvn clean package -DskipTests

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nFAILED to build statistics-service" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "SUCCESS! JAR files built successfully" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

$jarPath = Join-Path $statsServicePath "target\statisticsservice.jar"
if (Test-Path $jarPath) {
    $jarInfo = Get-Item $jarPath
    Write-Host "JAR location: $jarPath" -ForegroundColor Yellow
    Write-Host "Size: $($jarInfo.Length) bytes" -ForegroundColor Yellow
    Write-Host "Date: $($jarInfo.LastWriteTime)" -ForegroundColor Yellow
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. docker-compose build statistics-service" -ForegroundColor White
    Write-Host "  2. docker-compose up -d statistics-service" -ForegroundColor White
} else {
    Write-Host "WARNING: JAR file not found at expected location" -ForegroundColor Yellow
}
