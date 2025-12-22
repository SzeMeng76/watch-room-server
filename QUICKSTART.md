# 快速开始指南

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置 `AUTH_KEY`。

### 3. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3001 启动。

## 生产部署

### 方案 1: Railway（最简单）

1. 访问 https://railway.app
2. 点击 "New Project" -> "Deploy from GitHub repo"
3. 选择你的仓库
4. 添加环境变量：
   - `AUTH_KEY`: 你的密钥
   - `ALLOWED_ORIGINS`: 你的前端域名
5. 点击 Deploy

Railway 会自动分配域名，例如：`https://your-app.railway.app`

### 方案 2: Fly.io（推荐）

```bash
# 安装 Fly CLI
curl -L https://fly.io/install.sh | sh

# 登录
fly auth login

# 部署
fly launch

# 设置环境变量
fly secrets set AUTH_KEY=your-secret-key
fly secrets set ALLOWED_ORIGINS=https://your-domain.com

# 部署
fly deploy
```

### 方案 3: Docker

```bash
# 配置环境变量
cp .env.example .env
# 编辑 .env

# 启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 方案 4: VPS

```bash
# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 克隆代码
git clone <your-repo>
cd watch-room-server

# 安装依赖
npm install

# 构建
npm run build

# 配置环境变量
cp .env.example .env
nano .env

# 启动
pm2 start dist/index.js --name watch-room-server

# 设置开机自启
pm2 startup
pm2 save
```

## 配置 MoonTVPlus

### 方法 1: 环境变量

在 Vercel 项目设置中添加：

```
WATCH_ROOM_ENABLED=true
WATCH_ROOM_SERVER_TYPE=external
WATCH_ROOM_EXTERNAL_SERVER_URL=https://your-server.com
WATCH_ROOM_EXTERNAL_SERVER_AUTH=your-secret-auth-key
```

### 方法 2: 管理后台

1. 登录 MoonTVPlus 管理后台
2. 进入"观影室设置"
3. 启用观影室功能
4. 选择"外部服务器"
5. 填写：
   - 服务器地址: `https://your-server.com`
   - 认证密钥: `your-secret-auth-key`
6. 保存设置

## 验证部署

### 1. 检查健康状态

```bash
curl https://your-server.com/health
```

应该返回：
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 123.45
}
```

### 2. 检查统计信息

```bash
curl -H "Authorization: Bearer your-auth-key" https://your-server.com/stats
```

### 3. 测试 WebSocket 连接

在浏览器控制台：

```javascript
const socket = io('https://your-server.com', {
  auth: { token: 'your-auth-key' },
  extraHeaders: { Authorization: 'Bearer your-auth-key' }
});

socket.on('connect', () => console.log('✅ 连接成功'));
socket.on('connect_error', (err) => console.error('❌ 连接失败:', err));
```

## 常见问题

### Q: 连接失败怎么办？

A: 检查：
1. AUTH_KEY 是否匹配
2. ALLOWED_ORIGINS 是否包含你的域名
3. 防火墙是否开放端口
4. 服务器是否正常运行

### Q: WebSocket 连接不上？

A: 如果使用 Nginx，确保配置了 WebSocket 支持：

```nginx
location / {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Q: 如何更新服务？

A:
- Railway/Fly.io: 推送代码到 GitHub 自动部署
- Docker: `docker-compose pull && docker-compose up -d`
- PM2: `git pull && npm run build && pm2 restart watch-room-server`

## 下一步

- 查看完整文档: [README.md](README.md)
- 配置 HTTPS 和域名
- 设置监控和日志
- 配置自动备份
