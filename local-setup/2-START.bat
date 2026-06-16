@echo off
chcp 65001 >nul 2>&1
title Allied School - Running (Band Mat Karo!)
color 0B

echo.
echo  ============================================
echo   ALLIED SCHOOL REHMAN CAMPUS
echo   System Shuru Ho Raha Hai...
echo  ============================================
echo.

REM Load environment
set "ENV_FILE=%~dp0..\.env"
if not exist "%ENV_FILE%" (
    color 0C
    echo  [ERROR] .env file nahi mili!
    echo  Pehle 1-SETUP.bat chalayein.
    pause
    exit /b 1
)

REM Read .env file
for /f "usebackq tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
    set "%%a=%%b"
)

REM Start PostgreSQL service if not running
echo  [1/2] Database start kar raha hoon...
net start postgresql-x64-16 >nul 2>&1
net start postgresql-x64-15 >nul 2>&1
net start postgresql >nul 2>&1
echo  [OK] Database ready

REM Get local IP for network access info
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "LOCAL_IP=%%a"
    goto :found_ip
)
:found_ip
set "LOCAL_IP=%LOCAL_IP: =%"

echo  [2/2] Server shuru ho raha hai...
echo.
echo  ============================================
echo   SYSTEM CHAL RAHA HAI!
echo.
echo   Is computer pe kholein:
echo   http://localhost:3000
echo.
echo   School network pe kholein:
echo   http://%LOCAL_IP%:3000
echo.
echo   Login: admin / allied2024
echo.
echo   YEH WINDOW BAND MAT KARO!
echo   (Minimize kar sakte hain)
echo  ============================================
echo.

cd /d "%~dp0.."
node --enable-source-maps artifacts\api-server\dist\index.mjs

echo.
echo  Server band ho gaya.
pause
