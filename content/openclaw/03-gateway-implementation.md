+++
title = "OpenClaw 系列（三）：源码解析 - Gateway 核心实现"
date = 2026-02-01
description = "深入 Gateway 源码：WebSocket 连接管理、RPC 方法分发、Agent 调用实现"
[taxonomies]
tags = ["OpenClaw", "源码分析", "WebSocket", "RPC", "后端"]
+++

## 前言

本文将深入 `src/gateway/` 目录，逐行分析 Gateway 的核心实现。

## 服务器启动流程

```typescript
// src/gateway/server.impl.ts
export async function startGatewayServer(options: GatewayOptions) {
  const server = new WebSocketServer({
    host: options.bind,
    port: options.port,
  });

  // 注册连接处理器
  server.on("connection", (ws, req) => {
    handleConnection(ws, req, options);
  });

  // 启动渠道插件
  await initializeChannels(options.channels);

  // 启动定时任务
  startCronScheduler(options.cron);

  return server;
}
```

## WebSocket 连接管理

```typescript
// src/gateway/server/ws-connection.ts
export class WsConnection {
  private ws: WebSocket;
  private state: ConnectionState = "pending";
  private challenge: string;
  private deviceId?: string;

  constructor(ws: WebSocket, req: IncomingMessage) {
    this.ws = ws;
    this.challenge = crypto.randomBytes(32).toString("hex");
    
    // 设置握手超时
    this.handshakeTimer = setTimeout(() => {
      if (this.state === "pending") {
        this.close(4001, "Handshake timeout");
      }
    }, HANDSHAKE_TIMEOUT);

    this.setupHandlers();
  }

  private setupHandlers() {
    this.ws.on("message", (data) => this.handleMessage(data));
    this.ws.on("close", () => this.handleClose());
    this.ws.on("error", (err) => this.handleError(err));
  }

  private async handleMessage(data: Buffer) {
    const frame = JSON.parse(data.toString());
    
    // 验证帧格式
    if (!validateFrame(frame)) {
      return this.sendError("Invalid frame format");
    }

    switch (frame.type) {
      case "req":
        await this.handleRequest(frame);
        break;
      default:
        this.sendError("Unexpected frame type");
    }
  }
}
```

## RPC 方法注册

```typescript
// src/gateway/server-methods.ts
export const serverMethods = new Map<string, MethodHandler>();

// 注册方法
export function registerMethod(
  name: string,
  schema: TSchema,
  handler: MethodHandler
) {
  const compiled = TypeCompiler.Compile(schema);
  
  serverMethods.set(name, async (params, ctx) => {
    // 参数验证
    if (!compiled.Check(params)) {
      throw new ValidationError(compiled.Errors(params));
    }
    return handler(params, ctx);
  });
}

// 方法分发
export async function dispatchMethod(
  method: string,
  params: unknown,
  ctx: RequestContext
): Promise<unknown> {
  const handler = serverMethods.get(method);
  if (!handler) {
    throw new MethodNotFoundError(method);
  }
  return handler(params, ctx);
}
```

## Agent 调用实现

```typescript
// src/gateway/server-methods/agent.ts
registerMethod("agent", AgentRequestSchema, async (params, ctx) => {
  const { message, agentId, sessionId, thinking } = params;
  
  // 生成运行 ID
  const runId = generateRunId();
  
  // 幂等性检查
  if (params.idempotencyKey) {
    const existing = await checkIdempotency(params.idempotencyKey);
    if (existing) return existing;
  }

  // 立即返回 accepted 状态
  ctx.send({
    type: "res",
    id: ctx.requestId,
    ok: true,
    payload: { runId, status: "accepted" },
  });

  // 异步执行 Agent
  runAgent({
    runId,
    message,
    agentId: agentId ?? "default",
    sessionId: sessionId ?? ctx.sessionId,
    thinking,
    onEvent: (event) => {
      ctx.send({
        type: "event",
        event: "agent",
        payload: { runId, ...event },
      });
    },
    onComplete: (result) => {
      ctx.send({
        type: "res",
        id: ctx.requestId,
        ok: true,
        payload: { runId, status: "complete", ...result },
      });
    },
  });
});
```

## 事件流处理

```typescript
// 事件发送
function emitEvent(
  connections: Set<WsConnection>,
  event: string,
  payload: unknown
) {
  const frame: EventFrame = {
    type: "event",
    event,
    payload,
    seq: nextSeq(),
  };
  
  const data = JSON.stringify(frame);
  for (const conn of connections) {
    if (conn.isReady()) {
      conn.send(data);
    }
  }
}

// Agent 流式输出
async function streamAgentOutput(
  runId: string,
  stream: AsyncIterable<AgentEvent>,
  ctx: RequestContext
) {
  for await (const event of stream) {
    ctx.send({
      type: "event",
      event: "agent",
      payload: {
        runId,
        kind: event.kind,
        data: event.data,
      },
    });
  }
}
```

## 错误处理

```typescript
// 统一错误格式
interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

// 错误码定义
const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  METHOD_NOT_FOUND: "METHOD_NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

// 错误响应
function sendErrorResponse(
  ctx: RequestContext,
  code: string,
  message: string
) {
  ctx.send({
    type: "res",
    id: ctx.requestId,
    ok: false,
    error: { code, message },
  });
}
```

## 性能优化点

1. **连接池复用**：WebSocket 长连接避免频繁握手
2. **消息批处理**：合并小消息减少 I/O
3. **幂等性缓存**：短期缓存避免重复执行
4. **流式响应**：Agent 输出实时推送

## 下篇预告

下一篇将分析多渠道消息集成机制，理解 ChannelPlugin 抽象层设计。

---

**系列文章导航**：
1. ✅ OpenClaw 快速入门与 Docker 部署指南
2. ✅ 深入理解 Gateway 架构设计
3. ✅ 源码解析 - Gateway 核心实现（本文）
4. 多渠道消息集成机制
5. Skills 系统与 MCP 协议集成
6. 记忆与上下文管理系统
7. 安全模型与沙箱机制
8. Pi Agent 运行时深度剖析
9. 生产环境部署与运维
10. 架构创新与不足总结

