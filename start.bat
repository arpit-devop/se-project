@echo off
title Starting Pharmaventory Servers
echo ========================================
echo Starting Backend and Frontend Servers
echo ========================================
echo.
echo Starting Backend Server (Port 8000)...
start "Backend Server" cmd /k "cd /d %~dp0backend-node && echo Backend Server - Port 8000 && npm start"
timeout /t 2 /nobreak >nul
echo Starting Frontend Server (Port 3000)...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && echo Frontend Server - Port 3000 && echo Please wait 30-60 seconds for compilation... && npm start"
echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Wait 30-60 seconds, then open: http://localhost:3000
echo.
echo Press any key to close this window (servers keep running)...
pause >nul
