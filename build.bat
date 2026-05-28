@echo off
chcp 65001 >nul
echo ============================================
echo   DolphinScheduler 运行监控平台 - 构建脚本
echo   (便携版 - 内嵌 Node.js 运行时)
echo ============================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo 当前 Node.js 版本: %NODE_VER%

echo.
echo [1/5] 安装服务端依赖...
cd /d "%~dp0server"
call npm install --production=false
if %errorlevel% neq 0 (
    echo [错误] 服务端依赖安装失败
    pause
    exit /b 1
)

echo.
echo [2/5] 编译服务端 TypeScript...
call npx tsc
if %errorlevel% neq 0 (
    echo [错误] 服务端编译失败
    pause
    exit /b 1
)

echo.
echo [3/5] 安装前端依赖并构建...
cd /d "%~dp0client"
call npm install
if %errorlevel% neq 0 (
    echo [错误] 前端依赖安装失败
    pause
    exit /b 1
)
call npx vite build
if %errorlevel% neq 0 (
    echo [错误] 前端构建失败
    pause
    exit /b 1
)

echo.
echo [4/5] 组装发布包...
cd /d "%~dp0"
if exist "dist" rmdir /s /q dist
mkdir dist
mkdir dist\nodejs
mkdir dist\server
mkdir dist\server\dist
mkdir dist\server\data

xcopy /e /y /q server\dist dist\server\dist
xcopy /e /y /q client\dist dist\server\client
copy /y server\package.json dist\server\package.json

echo.
echo 正在安装生产依赖到发布包...
cd /d "%~dp0dist\server"
call npm install --omit=dev
cd /d "%~dp0"

echo.
echo [5/5] 内嵌 Node.js 运行时...
echo 正在从本机 Node.js 安装目录复制运行时...

where node >nul 2>nul
for /f "tokens=*" %%i in ('where node') do set NODE_PATH=%%i
for %%i in ("%NODE_PATH%") do set NODE_DIR=%%~dpi

echo Node.js 目录: %NODE_DIR%

copy /y "%NODE_DIR%node.exe" dist\nodejs\ >nul 2>nul
if not exist "dist\nodejs\node.exe" (
    echo [错误] 无法复制 node.exe
    echo 请确保 Node.js 已正确安装
    pause
    exit /b 1
)

echo 复制核心运行时 DLL...
for %%f in ("%NODE_DIR%*.dll") do (
    copy /y "%%f" dist\nodejs\ >nul 2>nul
    echo   %%~nxf
)

echo.
echo 复制启动脚本...
copy /y "启动.vbs" dist\ >nul
copy /y "停止服务.bat" dist\ >nul
copy /y portable-start.bat dist\ >nul
copy /y start.sh dist\ >nul
copy /y mac-start.sh dist\ >nul
copy /y mac-stop.sh dist\ >nul
copy /y mac-launch.sh dist\ >nul

echo.
echo ============================================
echo   构建完成！
echo   发布包位于: %~dp0dist
echo.
echo   Windows: 双击 启动.vbs 无终端窗口+独立应用窗口
echo            双击 停止服务.bat 停止服务
echo            双击 portable-start.bat 终端模式启动
echo   Mac:     双击 mac-launch.sh 后台启动+自动打开浏览器
echo            bash mac-start.sh 终端模式启动
echo            bash mac-stop.sh 停止服务
echo   Linux:   bash start.sh (需安装 Node.js)
echo ============================================
pause
