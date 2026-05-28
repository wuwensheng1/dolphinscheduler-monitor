#!/bin/bash

PORT=${PORT:-3001}

echo "============================================"
echo "  DolphinScheduler 运行监控平台 - 启动"
echo "  http://localhost:$PORT"
echo "============================================"
echo

if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js 18+"
    exit 1
fi

PID=$(lsof -i :$PORT -t 2>/dev/null)
if [ -n "$PID" ]; then
    CMD=$(ps -p $PID -o command= 2>/dev/null)
    if echo "$CMD" | grep -q "dist/index.js"; then
        echo "[提示] DolphinScheduler Monitor 服务已在运行中 (PID: $PID)"
        echo "访问地址: http://localhost:$PORT"
        exit 0
    else
        echo "[警告] 端口 $PORT 已被其他程序占用:"
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

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/server"

if [ ! -f "dist/index.js" ]; then
    echo "[错误] 未找到编译后的文件，请先运行构建"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install --omit=dev
fi

echo "正在启动服务..."
echo "访问地址: http://localhost:$PORT"
echo "按 Ctrl+C 停止服务"
echo

PORT=$PORT node dist/index.js
