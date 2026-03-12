@echo off
echo Restarting server with Gemini integration...
cd server
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
start cmd /k "npm start"
echo Server restarted!
echo.
echo Please configure your Gemini API key in Settings before using AI Chat.
pause
