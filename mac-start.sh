#!/bin/bash

echo "============================================"
echo "   DolphinScheduler 运行监控平台"
echo "   http://localhost:3001"
echo "============================================"
echo

if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js 18+"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

NODE_VER=$(node -v)
echo "Node.js 版本: $NODE_VER"
echo

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -f "$SCRIPT_DIR/server/dist/index.js" ]; then
    SERVER_DIR="$SCRIPT_DIR/server"
elif [ -f "$SCRIPT_DIR/dist/index.js" ]; then
    SERVER_DIR="$SCRIPT_DIR"
else
    echo "[错误] 未找到编译后的文件，请先运行构建"
    exit 1
fi

cd "$SERVER_DIR"

if [ ! -d "node_modules" ]; then
    echo "正在安装生产依赖..."
    npm install --omit=dev
    echo
fi

PORT=${PORT:-3001}

echo "正在启动服务..."
echo "访问地址: http://localhost:$PORT"
echo "按 Ctrl+C 停止服务"
echo

node dist/index.js
