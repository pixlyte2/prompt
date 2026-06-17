@echo off
echo Installing dependencies...
echo.

echo Step 1: Installing server dependencies...
echo Current directory: %cd%
cd server
echo Changed to: %cd%
echo Running npm install...
npm install 2>&1
echo npm install exit code: %errorlevel%
cd ..
echo Back to: %cd%
echo Server step completed.
pause

echo Step 2: Installing client dependencies...
cd client
echo Changed to: %cd%
echo Running npm install...
npm install 2>&1
echo npm install exit code: %errorlevel%
cd ..
echo Client step completed.

echo All done!
pause
