#!/bin/bash
echo "============================================"
echo "  DolphinScheduler 运行监控平台 - 启动"
echo "============================================"
echo

if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js 18+"
    exit 1
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
echo "访问地址: http://localhost:3001"
echo "按 Ctrl+C 停止服务"
echo

node dist/index.js
