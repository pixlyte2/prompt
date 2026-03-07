@echo off
setlocal enabledelayedexpansion

echo Testing Login and Get Channels...

REM Login and capture response
echo Getting JWT token...
curl -s -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"pixlyt.e1@gmail.com\",\"password\":\"Pixlyt@123\"}" > login_response.json

REM Extract token using PowerShell
for /f "usebackq delims=" %%i in (`powershell -command "(Get-Content login_response.json | ConvertFrom-Json).token"`) do set TOKEN=%%i

echo Token: !TOKEN!

REM Test Get Channels with token
echo.
echo Testing Get Channels...
curl -X GET http://localhost:5000/api/channels ^
  -H "Authorization: Bearer !TOKEN!" ^
  -H "Content-Type: application/json"

del login_response.json
echo.
pause