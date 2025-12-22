# Watch Room Server - 项目总结

## 项目概述

这是一个为 MoonTVPlus 开发的独立观影室服务器，专门为部署在 Vercel 的前端应用提供实时同步观影功能。

## 项目结构

```
watch-room-server/
├── src/
│   ├── index.ts                 # 主入口文件
│   ├── watch-room-server.ts     # 观影室服务器核心逻辑
│   └── types.ts                 # TypeScript 类型定义
├── .env.example                 # 环境变量示例
├── .gitignore                   # Git 忽略文件
├── .dockerignore                # Docker 忽略文件
├── .eslintrc.json               # ESLint 配置
├── tsconfig.json                # TypeScript 配置
├── package.json                 # 项目依赖
├── Dockerfile                   # Docker 镜像配置
├── docker-compose.yml           # Docker Compose 配置
├── fly.toml                     # Fly.io 部署配置
├── deploy.sh                    # 部署脚本
├── README.md                    # 完整文档
└── QUICKSTART.md                # 快速开始指南
```

## 核心功能

### 1. 房间管理
- 创建房间（公开/私密）
- 加入房间（密码验证）
- 离开房间
- 房间列表查询
- 自动清理机制

### 2. 播放同步
- 播放状态同步
- 进度跳转同步
- 播放/暂停同步
- 切换视频/集数
- 直播频道切换

### 3. 实时通信
- 文字聊天
- 表情消息
- WebRTC 语音通话
- 心跳检测

### 4. 安全特性
- Bearer Token 认证
- CORS 跨域控制
- Helmet 安全头
- 环境变量配置

### 5. 监控和维护
- 健康检查端点
- 统计信息 API
- 详细日志记录
- 优雅关闭

## 技术实现

### 后端架构
- **Express**: HTTP 服务器
- **Socket.IO**: WebSocket 实时通信
- **TypeScript**: 类型安全
- **Docker**: 容器化部署

### 核心类: WatchRoomServer

```typescript
class WatchRoomServer {
  // 房间管理
  private rooms: Map<string, Room>
  private members: Map<string, Map<string, Member>>
  private socketToRoom: Map<string, RoomMemberInfo>

  // 事件处理
  - room:create/join/leave/list
  - play:update/seek/play/pause/change
  - live:change
  - chat:message
  - voice:offer/answer/ice
  - state:clear
  - heartbeat
}
```

### 自动清理机制
- 房主离线 30 秒：清除播放状态
- 房主离线 5 分钟：删除房间
- 房间无人：立即删除
- 每 10 秒检查一次

## 部署方案

### 1. Railway（推荐新手）
- 零配置部署
- 自动 HTTPS
- 免费额度充足

### 2. Fly.io（推荐生产）
- 全球 CDN
- 低延迟
- 灵活配置

### 3. Docker（推荐自建）
- 完全控制
- 易于迁移
- 资源隔离

### 4. VPS + PM2（推荐进阶）
- 最大灵活性
- 成本可控
- 性能优化

## 配置说明

### 环境变量

| 变量 | 说明 | 必需 | 默认值 |
|------|------|------|--------|
| PORT | 服务器端口 | 否 | 3001 |
| AUTH_KEY | 认证密钥 | 是 | - |
| ALLOWED_ORIGINS | 允许的来源 | 否 | * |
| NODE_ENV | 运行环境 | 否 | production |

### MoonTVPlus 配置

在 Vercel 环境变量中设置：

```env
WATCH_ROOM_ENABLED=true
WATCH_ROOM_SERVER_TYPE=external
WATCH_ROOM_EXTERNAL_SERVER_URL=https://your-server.com
WATCH_ROOM_EXTERNAL_SERVER_AUTH=your-secret-auth-key
```

## API 端点

### GET /health
健康检查，无需认证

### GET /stats
统计信息，需要 Bearer Token 认证

### WebSocket /socket.io
Socket.IO 连接，需要认证

## 性能指标

- 单实例支持：100-200 个并发房间
- 推荐配置：1 核 CPU + 512MB 内存
- 网络带宽：根据用户数调整

## 安全建议

1. ✅ 使用强密码作为 AUTH_KEY
2. ✅ 限制 ALLOWED_ORIGINS 为具体域名
3. ✅ 使用 HTTPS/WSS 加密连接
4. ✅ 定期更新依赖包
5. ✅ 启用防火墙
6. ✅ 使用反向代理（Nginx）

## 监控和日志

### 日志级别
- 连接/断开
- 房间创建/删除
- 错误和异常
- 心跳超时

### 监控指标
- 在线房间数
- 总用户数
- 服务器运行时间
- 内存使用

## 故障排查

### 常见问题

1. **连接失败**
   - 检查 AUTH_KEY
   - 检查 ALLOWED_ORIGINS
   - 查看服务器日志

2. **WebSocket 失败**
   - 确认 Nginx 配置
   - 检查 SSL 证书
   - 验证防火墙规则

3. **房间自动删除**
   - 正常清理机制
   - 房主需保持在线

## 扩展性

### 水平扩展
使用 Socket.IO Redis 适配器实现多实例：

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

### 垂直扩展
- 增加 CPU 核心数
- 增加内存容量
- 优化网络带宽

## 未来改进

- [ ] Redis 持久化房间数据
- [ ] 多实例负载均衡
- [ ] 更详细的统计分析
- [ ] 管理后台界面
- [ ] 录制回放功能
- [ ] 更多的房间权限控制

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue。

---

**开发完成时间**: 2024
**版本**: 1.0.0
**状态**: ✅ 生产就绪
