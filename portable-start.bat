@echo off
chcp 65001 >nul
title DolphinScheduler 运行监控平台
echo.
echo   ╔══════════════════════════════════════════╗
echo   ║   DolphinScheduler 运行监控平台          ║
echo   ║   http://localhost:3001                  ║
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
echo 浏览器访问: http://localhost:3001
echo 按 Ctrl+C 停止服务
echo.

cd /d "%~dp0server"
"%NODE_EXE%" dist\index.js
pause
