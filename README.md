# Watch Room Server

独立的观影室服务器，为部署在 Vercel 的 MoonTVPlus 提供实时同步观影功能。

## 功能特性

- 🎬 多人同步观影（播放/暂停/跳转同步）
- 💬 实时聊天系统
- 🎙️ 语音通话（WebRTC）
- 🏠 房间管理（创建/加入/离开）
- 🔐 密码保护和权限控制
- 🔄 自动重连和心跳检测
- 📊 服务器统计信息
- 🐳 Docker 支持

## 技术栈

- Node.js 18+
- TypeScript
- Express
- Socket.IO
- Docker

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器端口
PORT=3001

# 认证密钥（必需）- 请修改为强密码
AUTH_KEY=your-secret-auth-key-change-this

# 允许的跨域来源（逗号分隔）
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# 运行环境
NODE_ENV=production
```

### 3. 开发模式运行

```bash
npm run dev
```

### 4. 生产模式运行

```bash
# 构建
npm run build

# 启动
npm start
```

## Docker 部署

### 使用 Docker Compose（推荐）

1. 配置环境变量：

```bash
cp .env.example .env
# 编辑 .env 文件
```

2. 启动服务：

```bash
docker-compose up -d
```

3. 查看日志：

```bash
docker-compose logs -f
```

4. 停止服务：

```bash
docker-compose down
```

### 使用 Docker

```bash
# 构建镜像
docker build -t watch-room-server .

# 运行容器
docker run -d \
  --name watch-room-server \
  -p 3001:3001 \
  -e AUTH_KEY=your-secret-key \
  -e ALLOWED_ORIGINS=https://your-domain.com \
  watch-room-server
```

## 云服务器部署

### Railway 部署

1. 在 [Railway](https://railway.app) 创建新项目
2. 连接 GitHub 仓库或上传代码
3. 设置环境变量：
   - `AUTH_KEY`: 你的认证密钥
   - `ALLOWED_ORIGINS`: 你的前端域名
   - `PORT`: 3001（Railway 会自动分配）
4. Railway 会自动检测并部署

### Render 部署

1. 在 [Render](https://render.com) 创建新的 Web Service
2. 连接 GitHub 仓库
3. 配置：
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. 设置环境变量（同上）
5. 部署

### Fly.io 部署

1. 安装 Fly CLI：

```bash
curl -L https://fly.io/install.sh | sh
```

2. 登录：

```bash
fly auth login
```

3. 创建应用：

```bash
fly launch
```

4. 设置环境变量：

```bash
fly secrets set AUTH_KEY=your-secret-key
fly secrets set ALLOWED_ORIGINS=https://your-domain.com
```

5. 部署：

```bash
fly deploy
```

### VPS 部署（使用 PM2）

1. 安装 PM2：

```bash
npm install -g pm2
```

2. 构建项目：

```bash
npm install
npm run build
```

3. 使用 PM2 启动：

```bash
pm2 start dist/index.js --name watch-room-server
```

4. 设置开机自启：

```bash
pm2 startup
pm2 save
```

5. 查看日志：

```bash
pm2 logs watch-room-server
```

## Nginx 反向代理配置

如果使用 Nginx 作为反向代理，需要特别配置 WebSocket 支持：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 超时设置
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

## API 端点

### GET /health

健康检查端点

响应：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345.67
}
```

### GET /stats

服务器统计信息（需要认证）

请求头：
```
Authorization: Bearer YOUR_AUTH_KEY
```

响应：
```json
{
  "totalRooms": 5,
  "totalMembers": 12,
  "rooms": [
    {
      "id": "ABC123",
      "name": "我的观影室",
      "memberCount": 3,
      "isPublic": true,
      "hasPassword": false,
      "createdAt": 1234567890000
    }
  ]
}
```

### WebSocket /socket.io

Socket.IO 连接端点，需要在连接时提供认证：

```javascript
import { io } from 'socket.io-client';

const socket = io('https://your-server.com', {
  auth: {
    token: 'YOUR_AUTH_KEY'
  },
  extraHeaders: {
    Authorization: 'Bearer YOUR_AUTH_KEY'
  }
});
```

## MoonTVPlus 配置

在 MoonTVPlus 的环境变量中配置外部观影室服务器：

```env
# 观影室配置
WATCH_ROOM_ENABLED=true
WATCH_ROOM_SERVER_TYPE=external
WATCH_ROOM_EXTERNAL_SERVER_URL=https://your-server.com
WATCH_ROOM_EXTERNAL_SERVER_AUTH=your-secret-auth-key
```

或在管理后台的观影室设置中配置：

1. 进入管理后台 -> 观影室设置
2. 启用观影室功能
3. 选择"外部服务器"
4. 填写服务器地址和认证密钥

## 监控和维护

### 查看日志

Docker Compose:
```bash
docker-compose logs -f
```

PM2:
```bash
pm2 logs watch-room-server
```

### 重启服务

Docker Compose:
```bash
docker-compose restart
```

PM2:
```bash
pm2 restart watch-room-server
```

### 更新服务

1. 拉取最新代码
2. 重新构建
3. 重启服务

Docker Compose:
```bash
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

PM2:
```bash
git pull
npm install
npm run build
pm2 restart watch-room-server
```

## 性能优化

### 推荐配置

- CPU: 1 核心以上
- 内存: 512MB 以上
- 带宽: 根据同时在线用户数调整

### 扩展性

- 单实例可支持约 100-200 个并发房间
- 如需更高并发，可使用 Redis 适配器实现多实例负载均衡

## 故障排查

### 连接失败

1. 检查防火墙是否开放端口
2. 检查 ALLOWED_ORIGINS 配置
3. 检查 AUTH_KEY 是否匹配
4. 查看服务器日志

### WebSocket 连接失败

1. 确认 Nginx 配置了 WebSocket 支持
2. 检查 SSL 证书是否有效
3. 确认没有中间代理阻止 WebSocket

### 房间自动删除

- 房主离线 5 分钟后房间会自动删除
- 房主离线 30 秒后会清除播放状态
- 这是正常的清理机制

## 安全建议

1. 使用强密码作为 AUTH_KEY
2. 限制 ALLOWED_ORIGINS 为具体域名
3. 使用 HTTPS/WSS 加密连接
4. 定期更新依赖包
5. 启用防火墙，只开放必要端口
6. 使用 Nginx 等反向代理增加安全层

## 许可证

MIT

## 支持

如有问题，请提交 Issue 或联系开发者。
