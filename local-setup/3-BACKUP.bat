@echo off
chcp 65001 >nul 2>&1
title Allied School - Data Backup
color 0E

echo.
echo  ============================================
echo   ALLIED SCHOOL - DATA BACKUP
echo  ============================================
echo.

REM Create backup folder with date
for /f "tokens=1-3 delims=/" %%a in ("%date%") do set "BACKUP_DATE=%%c-%%b-%%a"
set "BACKUP_DIR=%~dp0backup_%BACKUP_DATE%"
mkdir "%BACKUP_DIR%" 2>nul

REM Load DB credentials from .env
set "ENV_FILE=%~dp0..\.env"
for /f "usebackq tokens=1,* delims==" %%a in ("%ENV_FILE%") do set "%%a=%%b"

echo  Backup folder: %BACKUP_DIR%
echo.

REM Export students
echo  [1/3] Students export ho rahe hain...
set PGPASSWORD=%DB_PASS_TEMP%
psql "%DATABASE_URL%" -c "\COPY (SELECT * FROM students) TO '%BACKUP_DIR%\students.csv' CSV HEADER;" >nul 2>&1
echo  [OK] students.csv

REM Export fee records
echo  [2/3] Fee records export ho rahe hain...
psql "%DATABASE_URL%" -c "\COPY (SELECT * FROM fee_records) TO '%BACKUP_DIR%\fees.csv' CSV HEADER;" >nul 2>&1
echo  [OK] fees.csv

REM Export attendance
echo  [3/3] Attendance export ho rahi hai...
psql "%DATABASE_URL%" -c "\COPY (SELECT * FROM attendance) TO '%BACKUP_DIR%\attendance.csv' CSV HEADER;" >nul 2>&1
echo  [OK] attendance.csv

echo.
echo  ============================================
echo   BACKUP COMPLETE!
echo   Folder: %BACKUP_DIR%
echo   Ise USB mein copy kar lein.
echo  ============================================
echo.
start "" "%BACKUP_DIR%"
pause
