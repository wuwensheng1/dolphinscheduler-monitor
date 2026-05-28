#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/dolphin-monitor.log"
PORT=${PORT:-3001}

if ! command -v node &> /dev/null; then
    osascript -e 'display alert "DolphinScheduler Monitor" message "未检测到 Node.js，请先安装 Node.js 18+" as critical'
    exit 1
fi

if [ -f "$SCRIPT_DIR/server/dist/index.js" ]; then
    SERVER_DIR="$SCRIPT_DIR/server"
elif [ -f "$SCRIPT_DIR/dist/index.js" ]; then
    SERVER_DIR="$SCRIPT_DIR"
else
    osascript -e 'display alert "DolphinScheduler Monitor" message "未找到编译后的文件，请先运行构建" as critical'
    exit 1
fi

PID=$(lsof -i :$PORT -t 2>/dev/null)
if [ -n "$PID" ]; then
    echo "服务已在运行中 (PID: $PID)"
    open "http://localhost:$PORT"
    exit 0
fi

cd "$SERVER_DIR"

if [ ! -d "node_modules" ]; then
    npm install --omit=dev > /dev/null 2>&1
fi

nohup node dist/index.js > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

echo "服务启动中 (PID: $SERVER_PID)..."

READY=false
for i in $(seq 1 30); do
    sleep 1
    if curl -s "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
        READY=true
        break
    fi
done

if $READY; then
    echo "服务已就绪，正在打开浏览器..."
    open "http://localhost:$PORT"
else
    osascript -e 'display alert "DolphinScheduler Monitor" message "服务启动超时，请检查日志文件" as warning'
    exit 1
fi
