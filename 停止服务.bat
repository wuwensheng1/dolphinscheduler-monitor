@echo off
chcp 65001 >nul
title 停止 DolphinScheduler 监控服务

echo 正在查找运行中的服务进程...
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" /fo list ^| findstr /i "PID"') do (
    wmic process where "ProcessId=%%a and CommandLine like '%%dist\\index.js%%'" get ProcessId 2>nul | findstr /r "[0-9]" >nul
    if not errorlevel 1 (
        echo 正在停止进程 PID: %%a
        taskkill /pid %%a /f >nul 2>nul
    )
)

echo.
echo 服务已停止。
timeout /t 3 >nul
