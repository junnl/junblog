+++
title = "OpenClaw 系列（九）：生产环境部署与运维"
date = 2026-02-02
description = "OpenClaw 生产部署最佳实践：云平台选择、Docker 配置、监控日志、资源优化、故障排查"
[taxonomies]
tags = ["OpenClaw", "部署", "运维", "Docker", "云服务", "后端"]
+++

## 前言

本文介绍 OpenClaw 在生产环境的部署和运维最佳实践。

## 云平台选择

| 平台 | 月费用 | 特点 | 推荐场景 |
|------|--------|------|----------|
| DigitalOcean | $6-12 | 一键部署镜像 | 快速上手 |
| Fly.io | $10-15 | 全球边缘部署 | 低延迟 |
| Hetzner | €3.79 | 性价比高 | 预算有限 |
| Oracle Cloud | 免费 | ARM 免费层 | 测试/学习 |

## DigitalOcean 部署

```bash
# 1. 创建 Droplet（推荐 2GB RAM）
doctl compute droplet create openclaw \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-2gb \
  --region sgp1

# 2. SSH 连接
ssh root@<droplet-ip>

# 3. 安装 OpenClaw
curl -fsSL https://get.openclaw.ai | bash

# 4. 配置环境变量
export ANTHROPIC_API_KEY="sk-ant-..."

# 5. 启动服务
openclaw onboard --install-daemon
```

## Fly.io 部署

```toml
# fly.toml
app = "my-openclaw"
primary_region = "sin"

[build]
  image = "ghcr.io/openclaw/openclaw:latest"

[env]
  OPENCLAW_ACCEPT_TOS = "yes"

[mounts]
  source = "openclaw_data"
  destination = "/data"

[[services]]
  internal_port = 18789
  protocol = "tcp"

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

```bash
# 部署
fly launch
fly secrets set ANTHROPIC_API_KEY="sk-ant-..."
fly deploy
```

## Docker 生产配置

```yaml
# docker-compose.prod.yml
services:
  gateway:
    image: ghcr.io/openclaw/openclaw:latest
    container_name: openclaw
    restart: always
    ports:
      - "127.0.0.1:18789:18789"
    volumes:
      - openclaw-data:/data
      - ./config.json5:/root/.openclaw/config.json5:ro
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENCLAW_ACCEPT_TOS=yes
      - NODE_OPTIONS=--max-old-space-size=1536
    command: ["gateway", "--bind", "lan", "--verbose"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:18789/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1'

volumes:
  openclaw-data:
```

## 监控与日志

### 日志配置

```json5
{
  gateway: {
    logging: {
      level: "info",        // debug | info | warn | error
      format: "json",       // json | pretty
      destination: "file",  // stdout | file
      filePath: "/data/logs/gateway.log",
      maxSize: "100m",
      maxFiles: 10,
    }
  }
}
```

### 健康检查

```bash
# CLI 检查
openclaw health

# HTTP 端点
curl http://localhost:18789/health

# 响应示例
{
  "status": "healthy",
  "uptime": 86400,
  "channels": {
    "telegram": "connected",
    "whatsapp": "connected"
  }
}
```

### Control UI

```bash
# 启动 Web 控制台
openclaw ui

# 访问 http://localhost:18790
```

## 资源优化

### 低内存环境 (1GB)

```bash
# 添加 Swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=768"
```

### 沙箱资源限制

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          memory: "512m",
          cpus: 0.5,
          pidsLimit: 128,
        }
      }
    }
  }
}
```

## 故障排查

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| OOM 崩溃 | 内存不足 | 增加 RAM 或 Swap |
| 端口冲突 | Gateway 已运行 | `lsof -i :18789` |
| 锁文件残留 | 非正常退出 | `rm -f ~/.openclaw/*.lock` |
| 健康检查失败 | 绑定地址错误 | 确保 `--bind lan` |

### 诊断命令

```bash
# 完整诊断
openclaw doctor --non-interactive

# 查看进程
ps aux | grep openclaw

# 内存使用
free -h

# Docker 容器状态
docker ps -a | grep openclaw
docker logs --tail 100 openclaw
```

## 成本估算

| 项目 | 低配方案 | 推荐方案 |
|------|----------|----------|
| 云服务器 | $4-6 | $10-15 |
| API 调用 | $10-50 | $50-200 |
| 存储 | $0-5 | $5-10 |
| **合计** | **$14-61** | **$65-225** |

## 运维清单

### 每日
- [ ] 检查 Gateway 健康状态
- [ ] 查看日志错误告警
- [ ] 监控磁盘空间

### 每周
- [ ] 检查更新 (`openclaw update --check`)
- [ ] 清理旧会话数据
- [ ] 清理 Docker (`docker system prune`)

### 每月
- [ ] 完整备份
- [ ] 安全更新
- [ ] 成本审计

## 下篇预告

最后一篇将全面总结 OpenClaw 的架构创新与不足。

---

**系列文章导航**：
1. ✅ OpenClaw 快速入门与 Docker 部署指南
2. ✅ 深入理解 Gateway 架构设计
3. ✅ 源码解析 - Gateway 核心实现
4. ✅ 多渠道消息集成机制
5. ✅ Skills 系统与 MCP 协议集成
6. ✅ 记忆与上下文管理系统
7. ✅ 安全模型与沙箱机制
8. ✅ Pi Agent 运行时深度剖析
9. ✅ 生产环境部署与运维（本文）
10. 架构创新与不足总结

