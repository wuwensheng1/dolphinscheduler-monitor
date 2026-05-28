@echo off
chcp 65001 >nul
echo ============================================
echo   DolphinScheduler 运行监控平台
echo ============================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

cd /d "%~dp0server"

if not exist "dist\index.js" (
    echo [错误] 未找到编译后的文件，请先运行 build.bat 构建
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install --omit=dev
)

echo 正在启动服务...
echo 访问地址: http://localhost:3001
echo 按 Ctrl+C 停止服务
echo.

node dist\index.js
pause
