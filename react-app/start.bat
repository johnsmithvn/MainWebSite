@echo off
setlocal enabledelayedexpansion

:: 🚀 MainWebSite React App - Quick Start Script (Windows)
:: This script helps you quickly start the React version of MainWebSite

echo.
echo 🚀 MainWebSite React App - Quick Start
echo ======================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

:: Get Node.js version
for /f "tokens=1 delims=." %%i in ('node --version') do set NODE_MAJOR=%%i
set NODE_MAJOR=%NODE_MAJOR:~1%
if !NODE_MAJOR! lss 18 (
    echo [ERROR] Node.js version 18+ is required. Current version: 
    node --version
    pause
    exit /b 1
)

echo [SUCCESS] Node.js version: 
node --version
echo.

:: Check if we're in the react-app directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the react-app directory
    pause
    exit /b 1
)

:: Check if backend server is running
echo [INFO] Checking backend server...
curl -s http://localhost:3000/api/source-keys.js >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Backend server is not running on port 3000
    echo [INFO] Please start the backend server first:
    echo   cd .. ^&^& npm run dev
    set /p "continue=Continue anyway? (y/N): "
    if /i not "!continue!"=="y" (
        exit /b 1
    )
) else (
    echo [SUCCESS] Backend server is running on port 3000
)
echo.

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed successfully
) else (
    echo [SUCCESS] Dependencies already installed
)
echo.

:: Ask user what they want to do
echo What would you like to do?
echo 1^) Start development server ^(recommended^)
echo 2^) Build for production
echo 3^) Preview production build
echo 4^) Clean install ^(remove node_modules and reinstall^)
echo.

set /p "choice=Choose an option (1-4): "

if "%choice%"=="1" (
    echo [INFO] Starting development server...
    echo [INFO] React app will be available at: http://localhost:3001
    echo [INFO] Press Ctrl+C to stop the server
    call npm run dev
) else if "%choice%"=="2" (
    echo [INFO] Building for production...
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Build failed
        pause
        exit /b 1
    )
    echo [SUCCESS] Build completed successfully
    echo [INFO] Build files are in the 'dist' directory
) else if "%choice%"=="3" (
    echo [INFO] Building and previewing production build...
    call npm run build
    if not errorlevel 1 (
        call npm run preview
    )
) else if "%choice%"=="4" (
    echo [INFO] Cleaning and reinstalling dependencies...
    if exist "node_modules" rmdir /s /q node_modules
    if exist "package-lock.json" del package-lock.json
    call npm install
    if errorlevel 1 (
        echo [ERROR] Clean install failed
        pause
        exit /b 1
    )
    echo [SUCCESS] Clean install completed
) else (
    echo [ERROR] Invalid option. Please choose 1-4.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Done! 🎉
pause
