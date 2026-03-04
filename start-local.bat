@echo off
start "Server" cmd /k "cd server && node app.js"
start "Client" cmd /k "cd client && npm run dev"
