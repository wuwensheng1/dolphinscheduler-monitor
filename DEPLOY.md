# DolphinScheduler 运行监控平台 — 安装部署与启动指南

## 1. 项目概述

DolphinScheduler 运行监控平台是一个基于 Web 的 DolphinScheduler 任务运行状态监控与分析系统，提供以下功能：

- **环境管理** — 配置多个 DolphinScheduler 数据库连接（MySQL / Doris）
- **项目调度** — 查看各项目下的工作流实例统计
- **告警中心** — 失败趋势分析（小时/天/周/月维度）、项目筛选、告警规则管理
- **综合评估** — 多维度指标评分与可视化仪表盘
- **指标判定** — 自定义指标阈值与评分规则

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Ant Design 5 + ECharts 5 + Vite 6 |
| 后端 | Node.js + Express 5 + TypeScript + MySQL2 + SQLite (sql.js) |
| 构建 | Vite (前端) + tsc (后端) |

---

## 2. 环境要求

### 2.1 开发环境

| 依赖 | 最低版本 | 说明 |
|------|----------|------|
| Node.js | 18+ | 推荐 LTS 版本 |
| npm | 9+ | 随 Node.js 安装 |
| DolphinScheduler | 3.x | 需要可访问的 MySQL/Doris 元数据库 |

### 2.2 运行环境（便携部署）

便携部署包内嵌 Node.js 运行时，**无需在目标机器上安装 Node.js**，只需：

- Windows 10/11（64 位）
- 可访问的 DolphinScheduler MySQL/Doris 数据库

### 2.3 运行环境（Linux 部署）

| 依赖 | 说明 |
|------|------|
| Node.js 18+ | 需手动安装 |
| DolphinScheduler | 需要可访问的 MySQL/Doris 元数据库 |

---

## 3. 开发模式启动

适用于开发者进行代码修改和调试。

### 3.1 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 3.2 启动后端服务

```bash
cd server
npm run dev
```

后端将在 `http://localhost:3001` 启动，支持热重载（tsx watch）。

### 3.3 启动前端开发服务器

```bash
cd client
npm run dev
```

前端开发服务器将在 `http://localhost:5173` 启动，自动代理 `/api` 请求到后端。

### 3.4 访问应用

打开浏览器访问 **http://localhost:5173**

> 开发模式下前端和后端分别运行在不同端口，前端通过 Vite 代理转发 API 请求。

---

## 4. 生产构建

### 4.1 手动构建

```bash
# 1. 编译后端 TypeScript
cd server
npx tsc

# 2. 构建前端生产包
cd ../client
npx vite build

# 3. 将前端产物复制到后端 client 目录
# Windows PowerShell:
Remove-Item -Recurse -Force ..\server\client -ErrorAction SilentlyContinue
Copy-Item -Recurse ..\client\dist ..\server\client

# Linux/macOS:
rm -rf ../server/client && cp -r ../client/dist ../server/client
```

### 4.2 一键构建脚本（Windows）

双击 `build.bat` 或在项目根目录执行：

```cmd
build.bat
```

该脚本自动完成：安装依赖 → 编译后端 → 构建前端 → 组装发布包 → 内嵌 Node.js 运行时。

构建产物输出到 `dist/` 目录，可直接分发。

---

## 5. Windows 部署

### 5.1 便携部署（推荐 — 双击即用）

#### 步骤 1：构建发布包

在开发机上运行 `build.bat`，生成 `dist/` 目录。

#### 步骤 2：分发

将整个 `dist/` 目录复制到目标机器，可重命名为任意名称（如 `DolphinSchedulerMonitor`）。

#### 步骤 3：启动

**方式 A — 独立窗口模式（推荐）**

双击 `启动.vbs`，系统将：

1. 后台静默启动 Node.js 服务（无终端窗口）
2. 自动等待服务就绪（最多 30 秒）
3. 以 Edge/Chrome `--app` 模式打开独立应用窗口（无地址栏、无标签页，类似桌面应用）

> 优先使用 Microsoft Edge（Windows 自带），其次 Chrome，最后回退到默认浏览器。

**方式 B — 终端模式**

双击 `portable-start.bat`，在终端窗口中启动服务，可看到日志输出，按 `Ctrl+C` 停止。

#### 步骤 4：停止服务

双击 `停止服务.bat`，自动查找并终止后台运行的服务进程。

### 5.2 系统安装模式（需要系统 Node.js）

如果目标机器已安装 Node.js 18+：

1. 将 `server/` 目录（含 `dist/`、`client/`、`package.json`）复制到目标机器
2. 在目标机器上执行：

```cmd
cd server
npm install --omit=dev
node dist\index.js
```

3. 浏览器访问 `http://localhost:3001`

### 5.3 开机自启动（可选）

使用 Windows 任务计划程序设置开机自启：

1. 打开"任务计划程序"（`taskschd.msc`）
2. 创建基本任务 → 触发器选"计算机启动时"
3. 操作选"启动程序"，程序填 `cscript`，参数填 `//nologo "C:\path\to\启动.vbs"`
4. 起始于填 VBS 所在目录

---

## 6. Linux 部署

### 6.1 基本部署

```bash
# 1. 安装 Node.js 18+ (如未安装)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 将项目复制到服务器
scp -r server/ user@server:/opt/dolphinscheduler-monitor/

# 3. 安装生产依赖
cd /opt/dolphinscheduler-monitor/server
npm install --omit=dev

# 4. 启动服务
node dist/index.js
```

服务启动后访问 `http://<服务器IP>:3001`。

### 6.2 使用启动脚本

```bash
cd /opt/dolphinscheduler-monitor
bash start.sh
```

### 6.3 systemd 服务（开机自启）

创建服务文件：

```bash
sudo nano /etc/systemd/system/dolphinscheduler-monitor.service
```

写入以下内容（根据实际路径修改）：

```ini
[Unit]
Description=DolphinScheduler Monitor Platform
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/dolphinscheduler-monitor/server
ExecStart=/usr/bin/node /opt/dolphinscheduler-monitor/server/dist/index.js
Restart=on-failure
RestartSec=10
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

启用并启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable dolphinscheduler-monitor
sudo systemctl start dolphinscheduler-monitor

# 查看状态
sudo systemctl status dolphinscheduler-monitor

# 查看日志
sudo journalctl -u dolphinscheduler-monitor -f
```

### 6.4 Nginx 反向代理（可选）

如需通过域名或 80/443 端口访问：

```nginx
server {
    listen 80;
    server_name monitor.example.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 7. 配置说明

### 7.1 端口配置

默认端口为 `3001`，可通过环境变量修改：

```bash
# Linux
PORT=8080 node dist/index.js

# Windows CMD
set PORT=8080 && node dist\index.js

# Windows PowerShell
$env:PORT=8080; node dist\index.js
```

### 7.2 数据库配置

应用首次启动后，通过 Web 界面添加 DolphinScheduler 数据库连接：

1. 访问应用 → 点击左侧菜单"环境管理"
2. 点击"添加环境"
3. 填写数据库连接信息：

| 字段 | 说明 | 示例 |
|------|------|------|
| 名称 | 环境标识 | 生产环境 |
| 主机 | 数据库地址 | 10.0.0.1 |
| 端口 | 数据库端口 | 3306 |
| 数据库名 | DolphinScheduler 元数据库名 | dolphinscheduler |
| 用户名 | 数据库用户 | root |
| 密码 | 数据库密码 | ****** |
| 数据库类型 | MySQL 或 Doris | mysql |

配置信息保存在 `server/data/config.db`（SQLite 本地数据库）中。

### 7.3 目录结构说明

```
项目根目录/
├── server/                  # 后端服务
│   ├── src/                 # TypeScript 源码
│   ├── dist/                # 编译后的 JavaScript
│   ├── client/              # 前端静态文件（构建后生成）
│   ├── data/                # 本地配置数据库
│   │   └── config.db        # SQLite 数据库文件
│   └── package.json
├── client/                  # 前端项目（开发用）
│   ├── src/                 # React 源码
│   └── dist/                # 前端构建产物
├── 启动.vbs                 # Windows 独立窗口启动（无终端）
├── portable-start.bat       # Windows 终端模式启动
├── start.bat                # Windows 系统模式启动
├── 停止服务.bat              # Windows 停止服务
├── start.sh                 # Linux 启动脚本
└── build.bat                # 一键构建脚本
```

---

## 8. 常见问题

### Q: 双击 `启动.vbs` 后没有反应？

1. 检查 `server/dist/index.js` 是否存在（是否已构建）
2. 检查 `server/node_modules` 是否存在（是否已安装依赖）
3. 用 `portable-start.bat` 终端模式启动，查看具体报错信息

### Q: 启动后弹出"Service startup timeout"？

1. 检查端口 3001 是否被占用：`netstat -ano | findstr 3001`
2. 检查 Node.js 进程是否正常运行：`tasklist | findstr node`
3. 用终端模式启动查看日志

### Q: 独立窗口打开的是普通浏览器标签页？

说明系统未安装 Edge 或 Chrome，VBS 回退到默认浏览器模式。安装 Microsoft Edge 即可解决。

### Q: Linux 上服务启动后无法访问？

1. 检查防火墙是否放行 3001 端口：`sudo ufw allow 3001`
2. 检查服务是否监听：`curl http://localhost:3001/api/health`
3. 如需外网访问，配置 Nginx 反向代理

### Q: 如何修改监听端口？

设置环境变量 `PORT`，参见 [7.1 端口配置](#71-端口配置)。

### Q: 数据库连接配置丢失？

配置保存在 `server/data/config.db` 文件中，请确保该文件未被删除或覆盖。备份此文件即可保留所有配置。

---

## 9. 更新升级

1. 拉取最新代码
2. 重新运行 `build.bat`（Windows）或手动构建
3. 将新的 `server/dist/`、`server/client/`、`server/node_modules/` 覆盖到部署目录
4. 保留 `server/data/config.db`（数据库配置）
5. 重启服务
