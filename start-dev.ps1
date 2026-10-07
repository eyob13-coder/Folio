# Folio Full-Stack Development Runner (PowerShell)
$root = $PSScriptRoot

if (-not $env:JAVA_HOME -and (Test-Path "C:\Program Files\Java\jdk-17")) {
    $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting Folio Digital Library (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "[1/2] Launching Spring Boot Backend on http://localhost:8080..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:JAVA_HOME='$env:JAVA_HOME'; Set-Location '$root\backend'; .\mvnw.cmd spring-boot:run"

Write-Host "[2/2] Launching Angular 19 Frontend on http://localhost:4200..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm start"

Write-Host "`nBoth services are starting in separate windows!" -ForegroundColor Yellow
Write-Host "  -> Frontend: http://localhost:4200" -ForegroundColor Cyan
Write-Host "  -> Backend:  http://localhost:8080/api/v1" -ForegroundColor Cyan
