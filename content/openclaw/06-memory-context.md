+++
title = "OpenClaw 系列（六）：记忆与上下文管理系统"
date = 2026-02-01
description = "分析 OpenClaw 的记忆系统：Session 存储、工作流记忆、向量搜索、上下文裁剪与压缩"
[taxonomies]
tags = ["OpenClaw", "记忆系统", "上下文", "向量搜索", "后端"]
+++

## 前言

记忆系统是 AI Agent 的核心挑战之一。本文分析 OpenClaw 如何管理会话历史和长期记忆。

## 记忆架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    Memory System                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────┐    │
│  │ Session History │    │     Workflow Memory         │    │
│  │    (JSONL)      │    │  ┌─────────┐ ┌───────────┐ │    │
│  │                 │    │  │MEMORY.md│ │Daily Notes│ │    │
│  │ Short-term      │    │  │(长期)   │ │(每日)     │ │    │
│  └────────┬────────┘    │  └─────────┘ └───────────┘ │    │
│           │             └──────────────┬──────────────┘    │
│           │                            │                    │
│           └────────────┬───────────────┘                    │
│                        ▼                                    │
│              ┌─────────────────┐                           │
│              │  Hybrid Search  │                           │
│              │  BM25 + Vector  │                           │
│              └─────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## Session 存储

```typescript
// src/config/sessions/store.ts
// 会话以 JSONL 格式存储
// ~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl

interface SessionMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: {
    channel?: string;
    senderId?: string;
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
  };
}

export class SessionStore {
  private basePath: string;

  async appendMessage(
    agentId: string,
    sessionId: string,
    message: SessionMessage
  ) {
    const filePath = this.getSessionPath(agentId, sessionId);
    const line = JSON.stringify(message) + "\n";
    await fs.appendFile(filePath, line);
  }

  async loadSession(
    agentId: string,
    sessionId: string
  ): Promise<SessionMessage[]> {
    const filePath = this.getSessionPath(agentId, sessionId);
    const content = await fs.readFile(filePath, "utf-8");
    
    return content
      .split("\n")
      .filter(Boolean)
      .map(line => JSON.parse(line));
  }
}
```

## 工作流记忆

```markdown
<!-- ~/.openclaw/agents/default/MEMORY.md -->
# Long-term Memory

## User Preferences
- Prefers concise responses
- Uses TypeScript for backend development
- Timezone: Asia/Shanghai

## Important Facts
- Project deadline: 2026-03-01
- Team size: 5 developers

## Learned Patterns
- User often asks about Docker deployment
- Prefers code examples over explanations
```

```markdown
<!-- ~/.openclaw/agents/default/memory/2026-02-01.md -->
# Daily Notes - 2026-02-01

## Conversations
- Discussed OpenClaw architecture
- Reviewed Gateway implementation

## Tasks Completed
- Created 10 blog posts about OpenClaw

## Follow-ups
- Need to review security configuration
```

## 向量搜索实现

```typescript
// src/memory/manager.ts
import { SqliteVec } from "sqlite-vec";

export class MemoryManager {
  private db: SqliteVec;
  private embedder: Embedder;

  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    // 1. BM25 关键词搜索
    const bm25Results = await this.bm25Search(query, options.limit * 2);
    
    // 2. 向量语义搜索
    const embedding = await this.embedder.embed(query);
    const vectorResults = await this.vectorSearch(embedding, options.limit * 2);
    
    // 3. RRF 融合排序
    return this.reciprocalRankFusion(bm25Results, vectorResults, options.limit);
  }

  private async bm25Search(query: string, limit: number) {
    return this.db.query(`
      SELECT id, content, bm25(memory_fts) as score
      FROM memory_fts
      WHERE memory_fts MATCH ?
      ORDER BY score DESC
      LIMIT ?
    `, [query, limit]);
  }

  private async vectorSearch(embedding: number[], limit: number) {
    return this.db.query(`
      SELECT id, content, vec_distance_cosine(embedding, ?) as distance
      FROM memory_vec
      ORDER BY distance ASC
      LIMIT ?
    `, [embedding, limit]);
  }

  private reciprocalRankFusion(
    bm25: SearchResult[],
    vector: SearchResult[],
    limit: number
  ): SearchResult[] {
    const k = 60; // RRF 常数
    const scores = new Map<string, number>();
    
    bm25.forEach((r, i) => {
      const score = 1 / (k + i + 1);
      scores.set(r.id, (scores.get(r.id) || 0) + score);
    });
    
    vector.forEach((r, i) => {
      const score = 1 / (k + i + 1);
      scores.set(r.id, (scores.get(r.id) || 0) + score);
    });
    
    return [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => /* fetch full result */);
  }
}
```

## 上下文裁剪

```typescript
// 工具结果 TTL 裁剪
interface ContextPruningOptions {
  maxTokens: number;
  toolResultTTL: number; // 毫秒
}

function pruneContext(
  messages: Message[],
  options: ContextPruningOptions
): Message[] {
  const now = Date.now();
  
  return messages.map(msg => {
    // 裁剪过期的工具结果
    if (msg.toolResults) {
      msg.toolResults = msg.toolResults.filter(
        r => now - r.timestamp < options.toolResultTTL
      );
    }
    return msg;
  }).filter(msg => {
    // 移除空消息
    return msg.content || msg.toolResults?.length;
  });
}
```

## 消息压缩

```typescript
// src/agents/compaction.ts
export async function compactSession(
  messages: Message[],
  options: CompactionOptions
): Promise<Message[]> {
  if (messages.length < options.threshold) {
    return messages;
  }

  // 保留最近的消息
  const recentMessages = messages.slice(-options.keepRecent);
  const oldMessages = messages.slice(0, -options.keepRecent);

  // 压缩旧消息为摘要
  const summary = await generateSummary(oldMessages);
  
  return [
    { role: "system", content: `Previous conversation summary:\n${summary}` },
    ...recentMessages,
  ];
}

async function generateSummary(messages: Message[]): Promise<string> {
  const response = await llm.complete({
    model: "claude-haiku",
    messages: [
      {
        role: "user",
        content: `Summarize this conversation in 3-5 bullet points:\n\n${
          messages.map(m => `${m.role}: ${m.content}`).join("\n")
        }`,
      },
    ],
  });
  
  return response.content;
}
```

## 局限性分析

| 方面 | 当前实现 | 理想方案 |
|------|----------|----------|
| 存储格式 | JSONL 文件 | 图数据库 |
| 语义压缩 | 简单摘要 | 认知压缩 |
| 实体关系 | 无 | 知识图谱 |
| 跨会话 | 独立存储 | 共享记忆 |

## 下篇预告

下一篇将分析安全模型与沙箱机制，理解 OpenClaw 如何保护系统安全。

---

**系列文章导航**：
1. ✅ OpenClaw 快速入门与 Docker 部署指南
2. ✅ 深入理解 Gateway 架构设计
3. ✅ 源码解析 - Gateway 核心实现
4. ✅ 多渠道消息集成机制
5. ✅ Skills 系统与 MCP 协议集成
6. ✅ 记忆与上下文管理系统（本文）
7. 安全模型与沙箱机制
8. Pi Agent 运行时深度剖析
9. 生产环境部署与运维
10. 架构创新与不足总结

