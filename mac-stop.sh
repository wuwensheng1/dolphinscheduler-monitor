#!/bin/bash

echo "正在查找运行中的 DolphinScheduler 监控服务..."

PIDS=$(lsof -i :3001 -t 2>/dev/null)

if [ -z "$PIDS" ]; then
    PIDS=$(pgrep -f "node.*dist/index.js" 2>/dev/null)
fi

if [ -z "$PIDS" ]; then
    echo "未发现运行中的服务进程。"
    exit 0
fi

echo "发现服务进程: $PIDS"
echo "正在停止服务..."

for PID in $PIDS; do
    kill "$PID" 2>/dev/null
    echo "  已发送停止信号到进程 $PID"
done

sleep 1

REMAINING=$(lsof -i :3001 -t 2>/dev/null)
if [ -n "$REMAINING" ]; then
    echo "进程未响应，强制终止..."
    for PID in $REMAINING; do
        kill -9 "$PID" 2>/dev/null
        echo "  已强制终止进程 $PID"
    done
fi

echo "服务已停止。"
