@echo off
echo Testing API Endpoints...
echo.

echo 1. Testing Health Check
curl -X GET http://localhost:5000/
echo.
echo.

echo 2. Testing Login (Replace with your credentials)
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"pixlyt.e1@gmail.com\",\"password\":\"Pixlyt@123\"}"
echo.
echo.

echo 3. Testing Get Channels (requires token)
set /p TOKEN="Enter your JWT token (or press Enter to skip): "
if not "%TOKEN%"=="" (
  curl -X GET http://localhost:5000/api/channels ^
    -H "Authorization: Bearer %TOKEN%"
  echo.
  echo.
)

echo 4. Testing Get Prompts (requires token)
if not "%TOKEN%"=="" (
  curl -X GET http://localhost:5000/api/prompts ^
    -H "Authorization: Bearer %TOKEN%"
  echo.
  echo.
)

echo.
echo API Testing Complete!
pause
