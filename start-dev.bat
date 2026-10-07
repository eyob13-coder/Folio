@echo off
title Folio Development Runner

echo ========================================================
echo   Starting Folio Digital Library (Backend + Frontend)
echo ========================================================

:: Detect or set JAVA_HOME for JDK 17
if not defined JAVA_HOME (
    if exist "C:\Program Files\Java\jdk-17" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-17"
    )
)

echo [1/2] Launching Spring Boot Backend on http://localhost:8080...
start "Folio Backend (Spring Boot)" cmd /k "cd /d "%~dp0backend" && mvnw.cmd spring-boot:run"

echo [2/2] Launching Angular 19 Frontend on http://localhost:4200...
start "Folio Frontend (Angular)" cmd /k "cd /d "%~dp0frontend" && npm start"

echo.
echo Both services are booting up in separate terminal windows:
echo   - Frontend: http://localhost:4200
echo   - Backend:  http://localhost:8080/api/v1
echo.
pause
