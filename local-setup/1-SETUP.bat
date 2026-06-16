@echo off
chcp 65001 >nul 2>&1
title Allied School - First Time Setup
color 0A

echo.
echo  ============================================
echo   ALLIED SCHOOL REHMAN CAMPUS
echo   Local Setup - Pehli Baar Chalayein
echo  ============================================
echo.

REM ── Check Node.js ──
echo [1/7] Node.js check kar raha hoon...
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] Node.js install nahi hai!
    echo.
    echo  Yahan se download karein:
    echo  https://nodejs.org  (LTS version)
    echo.
    echo  Install karke dobara chalayein.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  [OK] Node.js %NODE_VER% mil gaya

REM ── Check PostgreSQL ──
echo.
echo [2/7] PostgreSQL check kar raha hoon...
where psql >nul 2>&1
if errorlevel 1 (
    REM Try default path
    if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
        set "PATH=%PATH%;C:\Program Files\PostgreSQL\16\bin"
    ) else if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
        set "PATH=%PATH%;C:\Program Files\PostgreSQL\15\bin"
    ) else (
        color 0C
        echo.
        echo  [ERROR] PostgreSQL install nahi hai!
        echo.
        echo  Yahan se download karein:
        echo  https://www.postgresql.org/download/windows/
        echo.
        echo  Install karke dobara chalayein.
        pause
        exit /b 1
    )
)
echo  [OK] PostgreSQL mil gaya

REM ── Get DB Password ──
echo.
echo  ----------------------------------------
echo  PostgreSQL install karte waqt jo PASSWORD
echo  rakha tha woh likhein:
echo  ----------------------------------------
set /p "DB_PASS=  Password: "
if "%DB_PASS%"=="" (
    echo  [ERROR] Password blank nahi ho sakta!
    pause
    exit /b 1
)

REM ── Create Database ──
echo.
echo [3/7] Database bana raha hoon...
set PGPASSWORD=%DB_PASS%
psql -U postgres -c "CREATE DATABASE alliedschool;" 2>nul
REM Ignore error if already exists
echo  [OK] Database ready

REM ── Create .env file ──
echo.
echo [4/7] Configuration file bana raha hoon...
set "ENV_FILE=%~dp0..\\.env"
(
    echo DATABASE_URL=postgresql://postgres:%DB_PASS%@localhost:5432/alliedschool
    echo SESSION_SECRET=allied-school-local-secret-2024
    echo NODE_ENV=production
    echo PORT=3000
) > "%ENV_FILE%"
echo  [OK] .env file ban gayi

REM ── Install pnpm ──
echo.
echo [5/7] Package manager install kar raha hoon...
call npm install -g pnpm --silent 2>nul
echo  [OK] pnpm ready

REM ── Install Dependencies ──
echo.
echo [6/7] Packages install ho rahe hain (2-3 minute lagenge)...
cd /d "%~dp0.."
call pnpm install --frozen-lockfile
if errorlevel 1 (
    color 0C
    echo  [ERROR] Packages install nahi hue!
    pause
    exit /b 1
)
echo  [OK] Packages install ho gaye

REM ── Build & Setup DB ──
echo.
echo [7/7] App build ho rahi hai aur database setup ho raha hai...

REM Build frontend
set PORT=3000
set BASE_PATH=/
set NODE_ENV=production
call pnpm --filter @workspace/allied-school run build
if errorlevel 1 (
    color 0C
    echo  [ERROR] Frontend build fail!
    pause
    exit /b 1
)

REM Build API server
call pnpm --filter @workspace/api-server run build
if errorlevel 1 (
    color 0C
    echo  [ERROR] API server build fail!
    pause
    exit /b 1
)

REM Copy frontend dist to API server dist/public
if not exist "artifacts\api-server\dist\public" mkdir "artifacts\api-server\dist\public"
xcopy /E /I /Y "artifacts\allied-school\dist\public\*" "artifacts\api-server\dist\public\" >nul
echo  [OK] Frontend API server ke saath jod diya

REM Setup database tables
call pnpm --filter @workspace/db run push
if errorlevel 1 (
    color 0C
    echo  [ERROR] Database tables nahi bane!
    pause
    exit /b 1
)
echo  [OK] Database tables ban gaye

REM Add default login credentials
echo.
echo  Default login credentials add kar raha hoon...
set PGPASSWORD=%DB_PASS%
psql -U postgres -d alliedschool -c "INSERT INTO credentials (username, password, role) VALUES ('admin', 'allied2024', 'admin'), ('director', 'director2024', 'director'), ('principal', 'principal2024', 'principal') ON CONFLICT (username) DO NOTHING;" >nul 2>&1
echo  [OK] Login ready: admin / allied2024

echo.
color 0A
echo  ============================================
echo   SETUP COMPLETE! 
echo  ============================================
echo.
echo   Ab roz school mein 2-START.bat chalayein
echo   Browser mein jaayein: http://localhost:3000
echo   Login: admin / allied2024
echo.
echo  ============================================
pause
