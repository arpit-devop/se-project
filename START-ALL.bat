@echo off
title Starting Pharmaventory - All Servers
color 0A
echo ========================================
echo    PHARMAVENTORY - Starting Servers
echo ========================================
echo.

echo [1/2] Starting Backend Server...
start "Backend Server - Port 8000" cmd /k "cd /d %~dp0backend-node && color 0B && echo ======================================== && echo BACKEND SERVER - Port 8000 && echo ======================================== && npm start"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server...
cd /d %~dp0frontend
if exist node_modules\.cache rmdir /s /q node_modules\.cache >nul 2>&1
start "Frontend Server - Port 3000" cmd /k "cd /d %~dp0frontend && color 0E && echo ======================================== && echo FRONTEND SERVER - Port 3000 && echo ======================================== && echo Please wait 30-60 seconds for compilation... && echo. && npm start"

echo.
echo ========================================
echo    SERVERS STARTED!
echo ========================================
echo.
echo Two CMD windows opened:
echo   - Backend:  http://localhost:8000
echo   - Frontend: http://localhost:3000
echo.
echo IMPORTANT:
echo   1. Wait 30-60 seconds for frontend compilation
echo   2. Check CMD windows for status
echo   3. Look for "Compiled successfully!" in frontend
echo   4. Then open: http://localhost:3000
echo.
echo Press any key to close this window...
echo (Servers will keep running in other windows)
pause >nul

