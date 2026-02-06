+++
date = '2026-02-01T11:00:00+08:00'
draft = false
title = 'Agent Skills 深度解析：用热门项目教你写出实用的 Skill'
tags = ["skills", "agent", "ai-coding", "tutorial", "skills.sh", "superpowers"]
categories = ["agent-skills"]
+++

上一篇文章介绍了 Agent Skills 的概念。本文将用 **skills.sh 上真实的热门项目**，一步步拆解，教你如何写出一个**真正实用的 Skill**。

## 本文将用这两个项目作为教学案例

| 项目 | 安装量 | 类型 | 用途 |
|------|--------|------|------|
| **obra/superpowers** | 10K+ | 方法论 | 系统化调试、TDD、代码审查等通用开发方法 |
| **vercel-labs/agent-skills** | 77K+ | 技术规范 | React/Next.js 性能优化最佳实践 |

这两个项目代表了两种典型的 Skill 风格：
- **superpowers**：教 Agent **怎么做事**（方法论、流程）
- **vercel-labs**：教 Agent **怎么写代码**（技术规范、代码模板）

---

## 第一步：观察真实 Skill 的结构

让我们先看 `obra/superpowers` 中的 `systematic-debugging` Skill 的**完整结构**：

```
skills/systematic-debugging/
├── SKILL.md                          # 主文件（Agent 必读）
├── CREATION-LOG.md                   # 创建日志（可选）
├── root-cause-tracing.md             # 支持文档
├── defense-in-depth.md               # 支持文档
├── condition-based-waiting.md        # 支持文档
├── condition-based-waiting-example.ts # 代码示例
└── find-polluter.sh                  # 可执行脚本
```

**关键发现**：好的 Skill 不是一个孤立的 Markdown 文件，而是一个**小型知识库**：
- 主文件 `SKILL.md` 提供框架和入口
- 支持文档提供深度细节
- 代码示例和脚本提供**可直接执行**的工具

## 第二步：解剖 SKILL.md 的核心结构

以 `systematic-debugging` 的 SKILL.md 为例，拆解每个部分：

### 2.1 Front Matter（元数据）

```yaml
---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---
```

**作用**：告诉 Agent **什么时候激活这个 Skill**。

关键要点：
- `name`：简洁、有意义、可搜索
- `description`：描述**触发条件**，不是功能介绍

> ❌ 错误写法：`description: A comprehensive debugging guide`
> ✅ 正确写法：`description: Use when encountering any bug, before proposing fixes`

### 2.2 Overview（概述）

```markdown
## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**Violating the letter of this process is violating the spirit of debugging.**
```

**作用**：用**一句话**说清楚这个 Skill 的核心理念。

特点分析：
- 不是长篇大论，而是**精炼的原则**
- 用**粗体**强调核心要点
- 语气强硬（"is failure"、"Violating"），因为 Agent 需要明确的指令

### 2.3 The Iron Law（铁律）

```markdown
## The Iron Law

\`\`\`
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
\`\`\`

If you haven't completed Phase 1, you cannot propose fixes.
```

**作用**：设定**绝对不能违反的底线**。

这是优秀 Skill 的关键设计——给 Agent 设定"硬性约束"，而不只是"建议"。

### 2.4 When to Use（使用场景）

```markdown
## When to Use

Use for ANY technical issue:
- Test failures
- Bugs in production
- Unexpected behavior
- Performance problems

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious

**Don't skip when:**
- Issue seems simple (simple bugs have root causes too)
```

**作用**：明确告诉 Agent **何时应该/不应该使用**。

设计技巧：
- 用**列表**快速扫描
- 特别强调**反直觉的场景**（越紧急越要用）
- 提前打消 Agent 可能的"借口"

### 2.5 具体流程（The Four Phases）

这是 Skill 的**核心内容**。`systematic-debugging` 定义了四个阶段：

```markdown
## The Four Phases

You MUST complete each phase before proceeding to the next.

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully**
   - Don't skip past errors or warnings
   - They often contain the exact solution
   - Read stack traces completely

2. **Reproduce Consistently**
   - Can you trigger it reliably?
   - What are the exact steps?
```

**设计要点**：
- 阶段之间有**强制顺序**（"MUST complete each phase"）
- 每个步骤有**具体动作**（不是"分析问题"，而是"Read stack traces completely"）
- 包含**检查点**（"Can you trigger it reliably?"）

### 2.6 代码示例（嵌入诊断脚本）

```markdown
4. **Gather Evidence in Multi-Component Systems**

   **WHEN system has multiple components (CI → build → signing):**

   **BEFORE proposing fixes, add diagnostic instrumentation:**
   \`\`\`bash
   # Layer 1: Workflow
   echo "=== Secrets available in workflow: ==="
   echo "IDENTITY: ${IDENTITY:+SET}${IDENTITY:-UNSET}"

   # Layer 2: Build script
   echo "=== Env vars in build script: ==="
   env | grep IDENTITY || echo "IDENTITY not in environment"
   \`\`\`

   **This reveals:** Which layer fails (secrets → workflow ✓, workflow → build ✗)
```

**作用**：Agent 可以**直接复制使用**的代码。

> 💡 **关键洞见**：好的 Skill 不只是"告诉 Agent 该怎么做"，而是**给 Agent 工具**让它能做到。

### 2.7 Red Flags（危险信号）

```markdown
## Red Flags - STOP and Follow Process

If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"

**ALL of these mean: STOP. Return to Phase 1.**
```

**作用**：帮助 Agent **自我检测**是否偏离了正确方向。

这是非常聪明的设计——不是等错误发生后才纠正，而是**提前列出常见的错误思维模式**。

### 2.8 常见借口表（Common Rationalizations）

```markdown
## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need process" | Simple issues have root causes too. Process is fast for simple bugs. |
| "Emergency, no time for process" | Systematic debugging is FASTER than guess-and-check thrashing. |
| "Just try this first, then investigate" | First fix sets the pattern. Do it right from the start. |
```

**作用**：预先打消 Agent 可能用来跳过流程的"借口"。

这是 `superpowers` 项目的**杀手锏设计**——它预判了 Agent 可能的"偷懒"行为，并提前反驳。

---

## 第三步：对比两种 Skill 风格

现在让我们看另一个项目 `vercel-labs/agent-skills` 的 React Best Practices：

### Vercel 风格：规则索引 + 详细文档

```yaml
---
name: vercel-react-best-practices
description: React and Next.js performance optimization guidelines from Vercel Engineering.
  Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization.
---
```

```markdown
# Vercel React Best Practices

## When to Apply

Reference these guidelines when:
- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |

## Quick Reference

### 1. Eliminating Waterfalls (CRITICAL)

- `async-defer-await` - Move await into branches where actually used
- `async-parallel` - Use Promise.all() for independent operations

## How to Use

Read individual rule files for detailed explanations:
\`\`\`
rules/async-parallel.md
rules/bundle-barrel-imports.md
\`\`\`
```

### 两种风格对比

| 特点 | obra/superpowers | vercel-labs |
|------|------------------|-------------|
| **核心内容** | 流程和方法论 | 规则和代码模板 |
| **组织方式** | 单文件包含完整流程 | 主文件索引 + 详细规则文件 |
| **适用场景** | 通用开发实践 | 特定技术栈 |
| **Agent 使用方式** | 按阶段执行 | 按需查找规则 |
| **强调点** | "你必须这样做" | "这样做效果更好" |

---

## 第四步：动手写你的第一个 Skill

现在，让我们从零写一个**真正实用**的 Skill。

### 场景：Git Commit 规范

假设你的团队有特定的 Git commit 规范，但 Agent 总是忘记。

**创建文件** `.claude/skills/git-commit.md`（或 `.cursor/skills/git-commit.md`）：

```markdown
---
name: Git Commit Convention
description: Team's git commit message format and workflow
---

# Git Commit 规范

## 触发条件
- 提交代码时
- 创建 PR 时
- 用户提到 "commit" 或 "提交"

## Commit 格式

\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

### Type 类型（必选）

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(auth): 添加微信登录` |
| `fix` | Bug 修复 | `fix(cart): 修复价格计算错误` |
| `docs` | 文档更新 | `docs: 更新 README` |
| `style` | 代码格式 | `style: 格式化代码` |
| `refactor` | 重构 | `refactor(api): 简化请求逻辑` |
| `test` | 测试 | `test(utils): 添加单元测试` |
| `chore` | 构建/工具 | `chore: 升级依赖` |

### Scope 范围（可选）
模块名称，如：`auth`, `cart`, `user`, `api`

### Subject 主题
- 不超过 50 字符
- 使用祈使句："添加" 而非 "添加了"
- 不加句号

## 完整示例

\`\`\`bash
# ✅ 正确
git commit -m "feat(auth): 添加 Google OAuth 登录"
git commit -m "fix(cart): 修复商品数量为负数的问题"
git commit -m "docs: 更新 API 文档"

# ❌ 错误
git commit -m "update"
git commit -m "修复了一些 bug"
git commit -m "feat: 添加了新功能。"
\`\`\`

## 工作流程

1. **提交前检查**
   \`\`\`bash
   pnpm lint && pnpm test
   \`\`\`

2. **创建 commit**
   \`\`\`bash
   git add .
   git commit -m "type(scope): message"
   \`\`\`

3. **推送分支**
   \`\`\`bash
   git push origin feature/xxx
   \`\`\`

## 注意事项
- 每个 commit 只做一件事
- 不要提交敏感信息（API Key、密码等）
- commit message 使用中文或英文，项目内保持一致
```

**测试**：让 Agent 帮你提交代码，看它是否遵循规范。

## 第四步：进阶 - 写一个项目专用 Skill

让我们写一个更复杂的、项目专用的 Skill。

### 场景：API 接口开发规范

**创建文件** `.claude/skills/api-development.md`：

```markdown
---
name: API Development Guide
description: Standards for creating REST API endpoints in this project
---

# API 接口开发规范

## 触发条件
- 创建新的 API 接口
- 修改现有接口
- 用户提到 "接口"、"API"、"endpoint"

## 目录结构

\`\`\`
src/api/
├── users/                  # 用户模块
│   ├── index.ts           # 路由入口
│   ├── handlers.ts        # 请求处理器
│   ├── schemas.ts         # Zod 参数校验
│   ├── services.ts        # 业务逻辑
│   └── users.test.ts      # 测试文件
├── products/              # 商品模块
│   └── ...
└── shared/
    ├── middleware.ts      # 通用中间件
    └── errors.ts          # 错误定义
\`\`\`

## 代码模板

### 1. 路由入口 (index.ts)
\`\`\`ts
import { Router } from 'express';
import { createUser, getUser, updateUser, deleteUser } from './handlers';
import { validateRequest } from '../shared/middleware';
import { createUserSchema, updateUserSchema } from './schemas';

const router = Router();

router.post('/', validateRequest(createUserSchema), createUser);
router.get('/:id', getUser);
router.put('/:id', validateRequest(updateUserSchema), updateUser);
router.delete('/:id', deleteUser);

export default router;
\`\`\`

### 2. 参数校验 (schemas.ts)
\`\`\`ts
import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('邮箱格式不正确'),
    name: z.string().min(2, '名字至少 2 个字符'),
    password: z.string().min(8, '密码至少 8 个字符'),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    avatar: z.string().url().optional(),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
\`\`\`

### 3. 请求处理器 (handlers.ts)
\`\`\`ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from './services';
import { CreateUserInput } from './schemas';

export async function createUser(
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await UserService.create(req.body);
    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
\`\`\`

## 响应格式

### 成功响应
\`\`\`json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"  // 可选
}
\`\`\`

### 错误响应
\`\`\`json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "用户不存在"
  }
}
\`\`\`

### 常用错误码
| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| `VALIDATION_ERROR` | 400 | 参数校验失败 |
| `UNAUTHORIZED` | 401 | 未登录 |
| `FORBIDDEN` | 403 | 无权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 资源冲突 |
| `INTERNAL_ERROR` | 500 | 服务器错误 |

## 必须遵守

1. ✅ 所有接口必须有 Zod 参数校验
2. ✅ 所有接口必须有对应的测试
3. ✅ 敏感接口必须有权限验证中间件
4. ✅ 数据库操作必须使用事务（多表操作时）
5. ✅ 错误必须使用统一的错误格式

## 验证命令

\`\`\`bash
# 运行 API 测试
pnpm test:api

# 类型检查
pnpm typecheck

# 生成 API 文档
pnpm docs:api
\`\`\`
```

## 第五步：学习高级设计模式

从 `superpowers` 项目中提取的高级设计模式：

### 5.1 建立 Skill 之间的引用关系

```markdown
## Supporting Techniques

These techniques are part of systematic debugging and available in this directory:

- **`root-cause-tracing.md`** - Trace bugs backward through call stack
- **`defense-in-depth.md`** - Add validation at multiple layers

**Related skills:**
- **superpowers:test-driven-development** - For creating failing test case
- **superpowers:verification-before-completion** - Verify fix worked
```

**技巧**：让 Skills 形成**知识网络**，而不是孤立的文档。

### 5.2 添加"验证清单"

来自 `test-driven-development` 的设计：

```markdown
## Verification Checklist

Before marking work complete:

- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason (feature missing, not typo)
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Output pristine (no errors, warnings)

Can't check all boxes? You skipped TDD. Start over.
```

**作用**：给 Agent 一个**自检机制**，确保它真的完成了任务。

### 5.3 提供"当卡住时"的指导

```markdown
## When Stuck

| Problem | Solution |
|---------|----------|
| Don't know how to test | Write wished-for API. Write assertion first. |
| Test too complicated | Design too complicated. Simplify interface. |
| Must mock everything | Code too coupled. Use dependency injection. |
| Test setup huge | Extract helpers. Still complex? Simplify design. |
```

**技巧**：预判 Agent 可能遇到的困难，提前给出解决方案。

### 5.4 用对比格式展示正反例

```markdown
### RED - Write Failing Test

<Good>
\`\`\`typescript
test('retries failed operations 3 times', async () => {
  let attempts = 0;
  const operation = () => {
    attempts++;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  };
  const result = await retryOperation(operation);
  expect(result).toBe('success');
});
\`\`\`
Clear name, tests real behavior, one thing
</Good>

<Bad>
\`\`\`typescript
test('retry works', async () => {
  const mock = jest.fn()
    .mockRejectedValueOnce(new Error())
    .mockResolvedValueOnce('success');
  await retryOperation(mock);
  expect(mock).toHaveBeenCalledTimes(3);
});
\`\`\`
Vague name, tests mock not code
</Bad>
```

**技巧**：用 `<Good>` 和 `<Bad>` 标签明确区分正反例，比纯文字描述更清晰。

---

## 第六步：Skill 组织架构

### 单文件 vs 多文件

| 方式 | 适用场景 | 示例 |
|------|----------|------|
| 单文件 | 简单规范、快速参考 | `git-commit.md` |
| 多文件 | 复杂流程、大量规则 | `systematic-debugging/` |

### 多文件结构示例（参考 superpowers）

```
skills/
├── systematic-debugging/
│   ├── SKILL.md                     # 主入口（必读）
│   ├── root-cause-tracing.md        # 支持文档
│   ├── defense-in-depth.md          # 支持文档
│   ├── find-polluter.sh             # 可执行脚本
│   └── condition-based-waiting-example.ts  # 代码示例
├── test-driven-development/
│   ├── SKILL.md
│   └── testing-anti-patterns.md
└── _global.md                       # 全局规范
```

---

## 总结：优秀 Skill 的 8 个特征

从 `obra/superpowers` 和 `vercel-labs/agent-skills` 中总结：

| 特征 | 说明 | 示例 |
|------|------|------|
| **1. 明确的触发条件** | description 描述何时使用 | "Use when encountering any bug" |
| **2. 铁律/约束** | 设定不可违反的底线 | "NO FIXES WITHOUT ROOT CAUSE" |
| **3. 阶段化流程** | 把复杂任务分解为步骤 | Phase 1 → Phase 2 → Phase 3 |
| **4. 可复制的代码** | 给 Agent 现成的模板 | 诊断脚本、代码模板 |
| **5. 危险信号检测** | 帮 Agent 识别错误模式 | "If you catch yourself thinking..." |
| **6. 常见借口反驳** | 预防 Agent "偷懒" | "Excuse: X → Reality: Y" |
| **7. 验证清单** | 确保任务真正完成 | "Can't check all boxes? Start over." |
| **8. 技能关联** | 形成知识网络 | "Related skills: ..." |

---

## 下一步

1. **安装学习**：`npx skills add obra/superpowers`，阅读其 Skill 文件
2. **找痛点**：观察 Agent 在你项目中最常犯的错
3. **从小开始**：先写一个 50 行的简单 Skill
4. **迭代优化**：根据 Agent 表现调整

**记住**：

> *"If you catch yourself thinking 'Quick fix for now, investigate later' — STOP. Return to Phase 1."*
>
> — obra/superpowers

最好的 Skill 不是告诉 Agent "该怎么做"，而是**训练 Agent 的思维方式**。
