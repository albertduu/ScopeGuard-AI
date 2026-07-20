@echo off
title ScopeGuard AI

cd /d "%~dp0"

echo.
echo ========================================
echo          Starting ScopeGuard AI
echo ========================================
echo.

where node >nul 2>&1

if errorlevel 1 (
    echo Node.js is not installed.
    echo.
    echo Please install Node.js 20.9 or newer from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Checking dependencies...

if not exist "node_modules" (
    echo.
    echo Installing dependencies for the first launch...
    call npm install

    if errorlevel 1 (
        echo.
        echo Dependency installation failed.
        echo Please check your internet connection and try again.
        pause
        exit /b 1
    )
)

echo.
echo Opening ScopeGuard AI at http://localhost:3000
echo Keep this window open while using the application.
echo Press Ctrl+C when you are finished.
echo.

start "" "http://localhost:3000"
call npm run dev

pause