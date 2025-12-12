# PowerShell script to build JARs and start Docker Compose
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Auto-building ALL JAR files before Docker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Build all JARs using the unified script
& ".\build-all-jars.bat"
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "FAILED to build JAR files" -ForegroundColor Red
    Write-Host "Cannot proceed with Docker build" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Docker Compose..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

docker-compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS! All services started" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Services are running. Check status with:" -ForegroundColor Yellow
    Write-Host "  docker-compose ps" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "FAILED to start Docker Compose" -ForegroundColor Red
    exit $LASTEXITCODE
}
