+++
title = "OpenClaw 系列（八）：Pi Agent 运行时深度剖析"
date = 2026-02-02
description = "分析 Pi Agent 执行流程：Agent Loop、运行时实现、事件流处理、工具系统、扩展机制"
[taxonomies]
tags = ["OpenClaw", "Agent", "运行时", "工具系统", "后端"]
+++

## 前言

Pi Agent 是 OpenClaw 的核心执行引擎。本文深入分析其运行时实现。

## Agent Loop 概览

```
┌─────────────────────────────────────────────────────────────┐
│                      Agent Loop                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐ │
│  │ Intake  │───▶│ Context │───▶│  Model  │───▶│  Tool   │ │
│  │         │    │ Assembly│    │Inference│    │Execution│ │
│  └─────────┘    └─────────┘    └─────────┘    └────┬────┘ │
│       ▲                                            │       │
│       │         ┌─────────┐    ┌─────────┐        │       │
│       └─────────│ Persist │◀───│ Stream  │◀───────┘       │
│                 │         │    │ Reply   │                 │
│                 └─────────┘    └─────────┘                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 运行时入口

```typescript
// src/agents/pi-embedded-runner.ts
export async function runEmbeddedPiAgent(
  params: AgentRunParams
): Promise<AgentRunResult> {
  const { agentId, sessionId, message, thinking, onEvent } = params;

  // 1. 加载 Agent 配置
  const agent = await loadAgent(agentId);
  
  // 2. 加载会话历史
  const session = await loadSession(agentId, sessionId);
  
  // 3. 构建上下文
  const context = await buildContext(agent, session, message);
  
  // 4. 执行 Agent 循环
  return runEmbeddedAttempt({
    agent,
    context,
    thinking,
    onEvent,
  });
}
```

## 执行尝试实现

```typescript
// src/agents/pi-embedded-runner/run/attempt.ts
export async function runEmbeddedAttempt(
  params: AttemptParams
): Promise<AttemptResult> {
  const { agent, context, thinking, onEvent } = params;
  
  // 构建系统提示
  const systemPrompt = buildSystemPrompt(agent);
  
  // 准备工具
  const tools = await prepareTools(agent);
  
  // 调用模型
  const stream = await llm.stream({
    model: agent.model,
    system: systemPrompt,
    messages: context.messages,
    tools,
    thinking: thinking ?? "medium",
  });

  // 处理流式响应
  let response = "";
  const toolCalls: ToolCall[] = [];
  
  for await (const event of stream) {
    switch (event.type) {
      case "text":
        response += event.text;
        onEvent({ kind: "text", data: event.text });
        break;
        
      case "tool_use":
        toolCalls.push(event.toolCall);
        onEvent({ kind: "tool_call", data: event.toolCall });
        break;
        
      case "thinking":
        onEvent({ kind: "thinking", data: event.thinking });
        break;
    }
  }

  // 执行工具调用
  if (toolCalls.length > 0) {
    const results = await executeTools(toolCalls, agent);
    
    // 递归继续对话
    return runEmbeddedAttempt({
      ...params,
      context: {
        ...context,
        messages: [
          ...context.messages,
          { role: "assistant", content: response, toolCalls },
          { role: "user", content: formatToolResults(results) },
        ],
      },
    });
  }

  return { response, toolCalls: [] };
}
```

## 事件流处理

```typescript
// src/agents/pi-embedded-subscribe.ts
export type AgentEvent =
  | { kind: "lifecycle"; data: LifecycleEvent }
  | { kind: "text"; data: string }
  | { kind: "thinking"; data: string }
  | { kind: "tool_call"; data: ToolCall }
  | { kind: "tool_result"; data: ToolResult }
  | { kind: "error"; data: Error };

// 事件订阅
export function subscribeToAgent(
  runId: string,
  handler: (event: AgentEvent) => void
): Unsubscribe {
  const subscription = eventBus.subscribe(`agent:${runId}`, handler);
  return () => subscription.unsubscribe();
}
```

## 工具系统

```typescript
// src/agents/pi-tools.ts
export async function prepareTools(agent: Agent): Promise<Tool[]> {
  const tools: Tool[] = [];
  
  // 内置工具
  tools.push(
    createReadTool(agent),
    createWriteTool(agent),
    createEditTool(agent),
    createExecTool(agent),
  );
  
  // MCP 工具
  for (const server of agent.mcpServers) {
    const mcpTools = await loadMCPTools(server);
    tools.push(...mcpTools);
  }
  
  // 渠道工具
  if (agent.channel) {
    tools.push(...getChannelTools(agent.channel));
  }
  
  // 应用工具策略
  return applyToolPolicy(tools, agent.toolPolicy);
}

// 工具执行
async function executeTools(
  toolCalls: ToolCall[],
  agent: Agent
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  
  for (const call of toolCalls) {
    const tool = findTool(call.name);
    
    // 沙箱执行
    const result = agent.sandbox.enabled
      ? await executInSandbox(tool, call.input, agent.sandbox)
      : await tool.execute(call.input);
    
    results.push({
      toolCallId: call.id,
      output: result,
    });
  }
  
  return results;
}
```

## 系统提示构建

```typescript
// src/agents/system-prompt.ts
export function buildSystemPrompt(agent: Agent): string {
  const parts: string[] = [];
  
  // 基础提示
  parts.push(agent.systemPrompt || DEFAULT_SYSTEM_PROMPT);
  
  // 注入 Skills
  const skills = loadSkills(agent.workspacePath);
  for (const skill of skills) {
    if (checkSkillGating(skill).available) {
      parts.push(`## ${skill.name}\n${skill.instructions}`);
    }
  }
  
  // 注入记忆
  if (agent.memory) {
    const memories = await searchMemory(agent.memory, context);
    parts.push(`## Relevant Memories\n${memories}`);
  }
  
  // 注入时间信息
  parts.push(`Current time: ${new Date().toISOString()}`);
  
  return parts.join("\n\n");
}
```

## 队列系统

```typescript
// 会话级队列（串行执行）
const sessionQueues = new Map<string, Queue>();

// 全局队列（限制并发）
const globalQueue = new PQueue({ concurrency: 5 });

async function enqueueAgentRun(params: AgentRunParams) {
  const sessionQueue = getOrCreateSessionQueue(params.sessionId);
  
  return sessionQueue.add(() =>
    globalQueue.add(() => runEmbeddedPiAgent(params))
  );
}
```

## 扩展机制

```typescript
// Pi Extensions
interface PiExtension {
  name: string;
  hooks: {
    before_agent_start?: (ctx: HookContext) => Promise<void>;
    agent_end?: (ctx: HookContext) => Promise<void>;
    before_tool_call?: (ctx: ToolHookContext) => Promise<void>;
    after_tool_call?: (ctx: ToolHookContext) => Promise<void>;
  };
}

// 注册扩展
registerExtension({
  name: "logging",
  hooks: {
    before_agent_start: async (ctx) => {
      console.log(`Agent ${ctx.agentId} starting...`);
    },
    agent_end: async (ctx) => {
      console.log(`Agent ${ctx.agentId} completed in ${ctx.duration}ms`);
    },
  },
});
```

## 下篇预告

下一篇将介绍生产环境部署与运维最佳实践。

---

**系列文章导航**：
1. ✅ OpenClaw 快速入门与 Docker 部署指南
2. ✅ 深入理解 Gateway 架构设计
3. ✅ 源码解析 - Gateway 核心实现
4. ✅ 多渠道消息集成机制
5. ✅ Skills 系统与 MCP 协议集成
6. ✅ 记忆与上下文管理系统
7. ✅ 安全模型与沙箱机制
8. ✅ Pi Agent 运行时深度剖析（本文）
9. 生产环境部署与运维
10. 架构创新与不足总结

