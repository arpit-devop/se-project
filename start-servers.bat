@echo off
echo ========================================
echo Starting Pharmaventory Servers
echo ========================================
echo.

echo Starting Backend Server (Port 8000)...
start "Backend Server" cmd /k "cd /d %~dp0backend-node && npm start"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server (Port 3000)...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo Servers are starting in separate windows
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Please wait 30-60 seconds for:
echo   - Backend to connect to MongoDB
echo   - Frontend to compile React app
echo.
echo Then open: http://localhost:3000
echo.
pause

