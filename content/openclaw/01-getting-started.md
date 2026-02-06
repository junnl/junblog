+++
title = "OpenClaw 系列（一）：快速入门与 Docker 部署指南"
date = 2026-02-01
description = "从零开始部署 OpenClaw：npm/pnpm 安装、Docker 容器化部署、目录结构解析与最小化配置"
[taxonomies]
tags = ["OpenClaw", "Docker", "部署", "AI Agent", "后端"]
+++

## 前言

OpenClaw 是一个开源的个人 AI 助手项目，拥有 144k+ GitHub stars。本系列将从后端程序员的视角，深入分析其架构设计、源码实现和工程实践。

## 项目概览

| 属性 | 信息 |
|------|------|
| **GitHub Stars** | 144k+ |
| **主要语言** | TypeScript (82.9%) |
| **运行时要求** | Node.js ≥ 22 |
| **许可证** | MIT License |

## 安装方式

### 方式一：npm/pnpm 全局安装（推荐）

```bash
# npm 安装
npm install -g openclaw@latest

# 或 pnpm 安装
pnpm add -g openclaw@latest

# 运行引导向导
openclaw onboard --install-daemon
```

### 方式二：Docker 部署

```yaml
# docker-compose.yml
services:
  gateway:
    image: ghcr.io/openclaw/openclaw:latest
    container_name: openclaw-gateway
    restart: unless-stopped
    ports:
      - "18789:18789"
    volumes:
      - openclaw-data:/data
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENCLAW_ACCEPT_TOS=yes
    command: ["gateway", "--bind", "lan", "--verbose"]

volumes:
  openclaw-data:
```

启动命令：

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f gateway

# 健康检查
curl http://localhost:18789/health
```

### 方式三：从源码构建

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw

pnpm install
pnpm ui:build
pnpm build

pnpm openclaw onboard --install-daemon
```

## 目录结构

```
~/.openclaw/
├── config.json5          # 主配置文件
├── agents/               # Agent 工作区
│   └── default/
│       ├── AGENT.md      # Agent 系统提示
│       ├── MEMORY.md     # 长期记忆
│       ├── sessions/     # 会话历史 (JSONL)
│       └── memory/       # 每日笔记
├── skills/               # 用户自定义 Skills
├── logs/                 # 日志文件
└── gateway.*.lock        # 进程锁文件
```

## 最小化配置

```json5
// ~/.openclaw/config.json5
{
  // 模型配置
  models: {
    default: "claude-sonnet-4-20250514",
  },
  
  // Gateway 配置
  gateway: {
    bind: "localhost",
    port: 18789,
  },
  
  // Agent 默认配置
  agents: {
    defaults: {
      model: "claude-sonnet-4-20250514",
    }
  }
}
```

## 首次运行

```bash
# 1. 启动 Gateway
openclaw gateway --verbose

# 2. 发送测试消息
openclaw agent --message "Hello, OpenClaw!"

# 3. 检查健康状态
openclaw health
```

## 常见问题

| 问题 | 解决方案 |
|------|----------|
| 端口被占用 | `lsof -i :18789` 查找并终止进程 |
| 权限不足 | 检查 `~/.openclaw` 目录权限 |
| API Key 无效 | 确认环境变量 `ANTHROPIC_API_KEY` |

## 下篇预告

下一篇将深入分析 Gateway 的架构设计，理解其作为控制平面的核心理念。

---

**系列文章导航**：
1. ✅ OpenClaw 快速入门与 Docker 部署指南（本文）
2. 深入理解 Gateway 架构设计
3. 源码解析 - Gateway 核心实现
4. 多渠道消息集成机制
5. Skills 系统与 MCP 协议集成
6. 记忆与上下文管理系统
7. 安全模型与沙箱机制
8. Pi Agent 运行时深度剖析
9. 生产环境部署与运维
10. 架构创新与不足总结

