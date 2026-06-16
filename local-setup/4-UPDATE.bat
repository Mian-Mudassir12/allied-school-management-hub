@echo off
chcp 65001 >nul 2>&1
title Allied School - Update
color 0D

echo.
echo  ============================================
echo   ALLIED SCHOOL - APP UPDATE
echo   (Replit se naya code download karne ke baad)
echo  ============================================
echo.
echo  Pehle 2-START.bat band karein, phir yeh chalayein.
echo.
pause

cd /d "%~dp0.."

REM Load env
set "ENV_FILE=%~dp0..\.env"
for /f "usebackq tokens=1,* delims==" %%a in ("%ENV_FILE%") do set "%%a=%%b"

set PORT=3000
set BASE_PATH=/
set NODE_ENV=production

echo  [1/3] Packages update ho rahe hain...
call pnpm install --frozen-lockfile

echo  [2/3] App rebuild ho rahi hai...
call pnpm --filter @workspace/allied-school run build
call pnpm --filter @workspace/api-server run build

echo  [3/3] Frontend copy ho raha hai...
xcopy /E /I /Y "artifacts\allied-school\dist\public\*" "artifacts\api-server\dist\public\" >nul

echo  [OK] Database tables update ho rahe hain...
call pnpm --filter @workspace/db run push

echo.
echo  ============================================
echo   UPDATE COMPLETE! Ab 2-START.bat chalayein.
echo  ============================================
pause
