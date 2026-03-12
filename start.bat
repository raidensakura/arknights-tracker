@echo off
chcp 65001 >nul
title Goyfield.moe (Local)

echo ==========================================
echo      Launch Goyfield.moe locally
echo ==========================================
echo.

echo [1/3] Installing/Checking modules...
cd arknights-backend
call npm install --quiet
cd ../arknights-tracker
call npm install --quiet
cd ..

echo.
echo [2/3] Starting servers...

start /b cmd /c "cd arknights-backend && node server.js"

cd arknights-tracker
echo.
echo [3/3] All done! 
echo The site will now open in your browser at http://localhost:5173
echo.

timeout /t 5 >nul
start http://localhost:5173

npm run dev