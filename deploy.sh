#!/bin/bash

# 部署脚本

set -e

echo "🚀 开始部署 Watch Room Server..."

# 检查环境变量
if [ -z "$AUTH_KEY" ]; then
    echo "❌ 错误: AUTH_KEY 环境变量未设置"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm ci --only=production

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建结果
if [ ! -d "dist" ]; then
    echo "❌ 构建失败: dist 目录不存在"
    exit 1
fi

echo "✅ 构建完成"

# 如果使用 PM2
if command -v pm2 &> /dev/null; then
    echo "🔄 使用 PM2 重启服务..."
    pm2 restart watch-room-server || pm2 start dist/index.js --name watch-room-server
    pm2 save
    echo "✅ PM2 服务已重启"
else
    echo "⚠️  PM2 未安装，请手动启动服务"
    echo "运行: node dist/index.js"
fi

echo "🎉 部署完成！"
