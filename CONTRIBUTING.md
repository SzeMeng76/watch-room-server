# 贡献指南

感谢你对 Watch Room Server 项目的关注！

## 如何贡献

### 报告问题

如果你发现了 bug 或有功能建议：

1. 检查 [Issues](https://github.com/your-repo/watch-room-server/issues) 是否已有相关问题
2. 如果没有，创建新的 Issue
3. 清晰描述问题或建议
4. 提供复现步骤（如果是 bug）

### 提交代码

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 添加适当的注释
- 保持代码简洁清晰

### 提交信息规范

使用语义化的提交信息：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具相关

示例：
```
feat: 添加房间密码加密功能
fix: 修复心跳检测超时问题
docs: 更新部署文档
```

### 开发流程

1. 安装依赖：`npm install`
2. 启动开发服务器：`npm run dev`
3. 运行 linter：`npm run lint`
4. 类型检查：`npm run typecheck`
5. 构建：`npm run build`

### 测试

在提交 PR 之前，请确保：

- [ ] 代码通过 ESLint 检查
- [ ] TypeScript 类型检查通过
- [ ] 构建成功
- [ ] 功能正常工作

## 行为准则

- 尊重他人
- 保持友善和专业
- 接受建设性批评
- 关注项目最佳利益

## 问题和支持

如有疑问，可以：

- 创建 Issue
- 发送邮件
- 加入讨论组

## 许可证

通过贡献代码，你同意你的贡献将在 MIT 许可证下发布。
