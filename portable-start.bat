@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title DolphinScheduler 运行监控平台

set "PORT=3001"

echo.
echo   ╔══════════════════════════════════════════╗
echo   ║   DolphinScheduler 运行监控平台          ║
echo   ║   http://localhost:%PORT%                ║
echo   ╚══════════════════════════════════════════╝
echo.

set "NODE_EXE=%~dp0nodejs\node.exe"

if exist "%NODE_EXE%" (
    echo [便携模式] 使用内嵌 Node.js 运行时
) else (
    echo [系统模式] 使用系统 Node.js
    where node >nul 2>nul
    if %errorlevel% neq 0 (
        echo.
        echo [错误] 未找到 Node.js 运行时！
        echo 请确认 nodejs\node.exe 存在，或安装 Node.js 到系统
        echo.
        pause
        exit /b 1
    )
    set "NODE_EXE=node"
)

netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do set "OCCUPIED_PID=%%a"
    wmic process where "ProcessId=!OCCUPIED_PID! and CommandLine like '%%dist\\index.js%%'" get ProcessId 2>nul | findstr /r "[0-9]" >nul 2>nul
    if !errorlevel! equ 0 (
        echo [提示] DolphinScheduler Monitor 服务已在运行中 ^(PID: !OCCUPIED_PID!^)
        echo 访问地址: http://localhost:%PORT%
        pause
        exit /b 0
    ) else (
        for /f "tokens=*" %%c in ('wmic process where "ProcessId=!OCCUPIED_PID!" get CommandLine 2^>nul ^| findstr /v "CommandLine" ^| findstr /r "."') do set "OCCUPIED_CMD=%%c"
        echo [警告] 端口 %PORT% 已被其他程序占用:
        echo   PID: !OCCUPIED_PID!
        echo   命令: !OCCUPIED_CMD!
        echo.
        echo 请选择操作:
        echo   1) 停止占用进程并启动本服务
        echo   2) 使用其他端口 (3002) 启动
        echo   3) 取消启动
        echo.
        set /p "choice=请输入选项 [1/2/3]: "
        if "!choice!"=="1" (
            echo 正在停止进程 !OCCUPIED_PID!...
            taskkill /pid !OCCUPIED_PID! /f >nul 2>nul
            timeout /t 1 >nul
            echo 进程已停止。
        ) else if "!choice!"=="2" (
            set "PORT=3002"
            echo 将使用端口 !PORT! 启动。
        ) else (
            echo 已取消启动。
            pause
            exit /b 0
        )
    )
)

if not exist "%~dp0server\dist\index.js" (
    echo [错误] 未找到服务端程序，请先运行 build.bat 构建
    pause
    exit /b 1
)

if not exist "%~dp0server\node_modules" (
    echo 正在安装生产依赖...
    cd /d "%~dp0server"
    call npm install --omit=dev
    cd /d "%~dp0"
)

echo 正在启动服务...
echo 浏览器访问: http://localhost:!PORT!
echo 按 Ctrl+C 停止服务
echo.

cd /d "%~dp0server"
set PORT=!PORT!
"%NODE_EXE%" dist\index.js
pause
