@echo off
title Starting Pharmaventory Servers
echo ========================================
echo Starting Pharmaventory on Localhost
echo ========================================
echo.

echo [1/2] Starting Backend Server (Port 8000)...
start "Backend - Port 8000" cmd /k "cd /d %~dp0backend-node && echo Backend Server Starting... && npm start"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server (Port 3000)...
cd /d %~dp0frontend
if exist node_modules\.cache rmdir /s /q node_modules\.cache
start "Frontend - Port 3000" cmd /k "cd /d %~dp0frontend && echo Frontend Server Starting... && echo Please wait 30-60 seconds for compilation... && npm start"

echo.
echo ========================================
echo Servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo IMPORTANT:
echo - Wait 30-60 seconds for frontend to compile
echo - Check the CMD windows for status
echo - Look for "Compiled successfully!" in frontend window
echo - Then open: http://localhost:3000
echo.
echo Press any key to exit this window (servers will keep running)...
pause >nul

