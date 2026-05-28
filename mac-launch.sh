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
    CMD=$(ps -p $PID -o command= 2>/dev/null)
    if echo "$CMD" | grep -q "dist/index.js"; then
        echo "DolphinScheduler Monitor 服务已在运行中 (PID: $PID)"
        open "http://localhost:$PORT"
        exit 0
    else
        echo "端口 $PORT 已被其他程序占用:"
        echo "  PID: $PID"
        echo "  命令: $CMD"
        echo
        echo "请选择操作:"
        echo "  1) 停止占用进程并启动本服务"
        echo "  2) 使用其他端口 (3002) 启动"
        echo "  3) 取消启动"
        echo
        read -p "请输入选项 [1/2/3]: " choice
        case $choice in
            1)
                echo "正在停止进程 $PID..."
                kill $PID 2>/dev/null
                sleep 1
                REMAINING=$(lsof -i :$PORT -t 2>/dev/null)
                if [ -n "$REMAINING" ]; then
                    kill -9 $REMAINING 2>/dev/null
                    sleep 1
                fi
                echo "进程已停止。"
                ;;
            2)
                PORT=3002
                echo "将使用端口 $PORT 启动。"
                ;;
            *)
                echo "已取消启动。"
                exit 0
                ;;
        esac
    fi
fi

cd "$SERVER_DIR"

if [ ! -d "node_modules" ]; then
    npm install --omit=dev > /dev/null 2>&1
fi

PORT=$PORT nohup node dist/index.js > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

echo "服务启动中 (PID: $SERVER_PID, 端口: $PORT)..."

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
