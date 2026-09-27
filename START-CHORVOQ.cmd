@echo off
setlocal
title Chorvoq Reservoir Atlas
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js topilmadi. Node.js o'rnatilgandan keyin qayta ishga tushiring.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Birinchi ishga tushirish: kutubxonalar o'rnatilmoqda...
  call npm install
  if errorlevel 1 (
    echo Kutubxonalarni o'rnatishda xato yuz berdi.
    pause
    exit /b 1
  )
)

echo.
echo CHORVOQ RESERVOIR ATLAS ishga tushmoqda...
echo Brauzer: http://localhost:3001/
echo Ushbu oynani yopish saytni to'xtatadi.
echo.

start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:3001/'"
call npm run dev -- --port 3001

endlocal
