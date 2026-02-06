+++
title = "OpenClaw 系列（七）：安全模型与沙箱机制"
date = 2026-02-02
description = "分析 OpenClaw 的安全设计：DM 访问控制、Gateway 认证、Docker 沙箱、工具策略、TLA+ 验证"
[taxonomies]
tags = ["OpenClaw", "安全", "沙箱", "Docker", "TLA+", "后端"]
+++

## 前言

AI Agent 的安全性至关重要。本文分析 OpenClaw 的多层安全模型。

## 安全架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: DM Access Control                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ pairing │ │allowlist│ │  open   │ │disabled │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Gateway Authentication                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Token Auth  │ │  Tailscale  │ │Device Pairing│          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Docker Sandbox                                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Modes     │ │   Scopes    │ │  Resources  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Tool Policies                                     │
│  ┌─────────────┐ ┌─────────────┐                           │
│  │ Allow/Deny  │ │  Elevated   │                           │
│  └─────────────┘ └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## DM 访问控制

```json5
{
  channels: {
    telegram: {
      dm: {
        // pairing: 需要配对码验证（默认）
        // allowlist: 仅允许白名单用户
        // open: 允许所有人（危险）
        // disabled: 禁用 DM
        policy: "pairing",
        allowFrom: ["123456789"],  // 白名单用户 ID
      }
    }
  }
}
```

### 配对流程

```
未知用户                    OpenClaw
    │                          │
    │── "Hello" ──────────────▶│
    │                          │
    │◀─ "配对码: ABC123" ──────│
    │                          │
    │                          │
管理员执行: openclaw pairing approve telegram ABC123
    │                          │
    │── "Hello again" ────────▶│
    │                          │
    │◀─ "你好！有什么..." ─────│
```

## Gateway 认证

```typescript
// src/gateway/auth.ts
export async function authenticateConnection(
  params: ConnectParams,
  config: AuthConfig
): Promise<AuthResult> {
  // 1. Token 认证
  if (config.token) {
    if (params.auth?.token !== config.token) {
      return { ok: false, error: "Invalid token" };
    }
  }

  // 2. Tailscale 认证
  if (config.allowTailscale && params.tailscaleIdentity) {
    const verified = await verifyTailscaleIdentity(params.tailscaleIdentity);
    if (verified) {
      return { ok: true, identity: params.tailscaleIdentity };
    }
  }

  // 3. 设备配对
  if (params.deviceId) {
    const device = await deviceStore.get(params.deviceId);
    if (device?.approved) {
      return { ok: true, deviceId: params.deviceId };
    }
    return { ok: false, error: "Device not approved" };
  }

  return { ok: false, error: "No valid authentication" };
}
```

## Docker 沙箱

```json5
{
  agents: {
    defaults: {
      sandbox: {
        // 模式: off | non-main | all
        mode: "non-main",
        
        // 作用域: session | agent | shared
        scope: "agent",
        
        // 工作区访问: none | ro | rw
        workspaceAccess: "ro",
        
        docker: {
          image: "node:22-slim",
          network: "none",        // 禁用网络
          readOnlyRoot: true,     // 只读根文件系统
          memory: "1g",           // 内存限制
          memorySwap: "2g",
          cpus: 1,
          pidsLimit: 256,         // 进程数限制
        }
      }
    }
  }
}
```

### 沙箱实现

```typescript
// src/agents/sandbox/docker.ts
export async function createSandbox(
  config: SandboxConfig
): Promise<SandboxContainer> {
  const container = await docker.createContainer({
    Image: config.docker.image,
    HostConfig: {
      Memory: parseMemory(config.docker.memory),
      MemorySwap: parseMemory(config.docker.memorySwap),
      CpuQuota: config.docker.cpus * 100000,
      PidsLimit: config.docker.pidsLimit,
      NetworkMode: config.docker.network,
      ReadonlyRootfs: config.docker.readOnlyRoot,
      SecurityOpt: ["no-new-privileges"],
      CapDrop: ["ALL"],
      Binds: buildBindMounts(config),
    },
  });

  await container.start();
  return new SandboxContainer(container);
}

function buildBindMounts(config: SandboxConfig): string[] {
  const mounts = [];
  
  if (config.workspaceAccess !== "none") {
    const mode = config.workspaceAccess === "ro" ? "ro" : "rw";
    mounts.push(`${config.workspacePath}:/workspace:${mode}`);
  }
  
  return mounts;
}
```

## 工具策略

```json5
{
  tools: {
    // 全局策略
    policy: {
      allow: ["read", "write", "edit"],
      deny: ["exec"],  // 禁止执行命令
    },
    
    // 提权模式
    elevated: {
      enabled: false,
      requireConfirmation: true,
      allowedTools: ["exec", "process"],
    }
  }
}
```

## TLA+ 形式化验证

```tla
--------------------------- MODULE AgentSecurity ---------------------------
VARIABLES
    dmPolicy,
    approvedUsers,
    sandboxMode,
    toolPermissions

TypeInvariant ==
    /\ dmPolicy \in {"pairing", "allowlist", "open", "disabled"}
    /\ approvedUsers \subseteq Users
    /\ sandboxMode \in {"off", "non-main", "all"}

SafetyInvariant ==
    /\ dmPolicy = "open" => \A u \in Users: CanAccess(u)
    /\ dmPolicy = "allowlist" => \A u \in Users: 
         CanAccess(u) <=> u \in approvedUsers
    /\ sandboxMode # "off" => AllToolsInSandbox

NoUnauthorizedAccess ==
    \A msg \in Messages:
        ProcessMessage(msg) => Authorized(msg.sender)
=============================================================================
```

## 安全检查命令

```bash
# 运行安全诊断
openclaw doctor

# 输出示例
✓ Gateway authentication enabled
✓ DM policy: pairing (safe)
⚠ Sandbox mode: off (consider enabling)
✓ Tool policy: exec denied
✓ No open ports exposed
```

## 安全最佳实践

| 场景 | 推荐配置 |
|------|----------|
| 个人使用 | `dmPolicy: "pairing"`, `sandbox: "non-main"` |
| 团队使用 | `dmPolicy: "allowlist"`, `sandbox: "all"` |
| 公开服务 | **不推荐**，如必须则启用所有防护 |

## 下篇预告

下一篇将深入分析 Pi Agent 运行时，理解 Agent 执行的完整流程。

---

**系列文章导航**：
1. ✅ OpenClaw 快速入门与 Docker 部署指南
2. ✅ 深入理解 Gateway 架构设计
3. ✅ 源码解析 - Gateway 核心实现
4. ✅ 多渠道消息集成机制
5. ✅ Skills 系统与 MCP 协议集成
6. ✅ 记忆与上下文管理系统
7. ✅ 安全模型与沙箱机制（本文）
8. Pi Agent 运行时深度剖析
9. 生产环境部署与运维
10. 架构创新与不足总结

