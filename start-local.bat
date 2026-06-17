@echo off
echo ==================================================
echo    Content Production System - Starting Services
echo ==================================================
echo.

echo Starting server on port 5000...
start "Server" cmd /k "cd server && npm run dev"

echo Waiting 3 seconds for server to initialize...
timeout /t 3 /nobreak >nul

echo Starting client development server...
start "Client" cmd /k "cd client && npm run dev"

echo.
echo ==================================================
echo Services started!
echo.
echo   Server:  http://localhost:5000
echo   Client:  http://localhost:5173
echo.
echo Press any key to close this window...
echo ==================================================
pause >nul