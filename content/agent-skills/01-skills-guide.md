+++
date = '2026-02-01T10:00:00+08:00'
draft = false
title = 'Agent Skills 完全指南：从入门到实战'
tags = ["skills", "agent", "ai-coding", "mcp", "claude-code", "cursor"]
categories = ["agent-skills"]
+++

AI 编程助手正在快速演进，**Agent Skills** 作为一种全新的 Agent 扩展范式，已经被各大 AI 编程工具广泛采用。本文将深入介绍 Skills 的概念、与 MCP 的区别、编写方法以及实用案例。

## 什么是 Agent Skills？

Agent Skills 是一种通过 **Markdown 文档** 来"教会" AI Agent 完成特定任务的机制。与传统的 API 调用不同，Skills 更像是给 Agent 一份"操作手册"，让它能够理解并执行复杂的工作流程。

### 支持 Skills 的主流工具

| 工具 | Skills 文件 | 状态 |
|------|------------|------|
| **Claude Code** | `SKILL.md` / `.claude/skills/` | ✅ 官方支持 |
| **Cursor** | `.cursor/skills/` | ✅ 官方支持 |
| **Windsurf** | 类似机制 | ✅ 支持 |
| **Codex CLI** | Skills 发现 | ✅ 支持 |
| **GitHub Copilot** | 跟进中 | 🔄 开发中 |

核心理念是一样的：**用 Markdown 教会 Agent 做事**，而不是给 Agent 固定的工具接口。

## Skills 与 MCP 的区别

### 什么是 MCP？

**MCP (Model Context Protocol)** 是 Anthropic 提出的模型上下文协议，通过定义标准化的工具接口，让 AI Agent 调用外部服务：

- 将外部能力封装成 **工具 (Tools)**
- Agent 通过 **函数调用** 使用这些工具
- 类似于传统的 REST API 调用模式

```json
// MCP 工具定义示例
{
  "name": "read_file",
  "description": "读取文件内容",
  "parameters": {
    "path": { "type": "string" }
  }
}
```

### Skills 的设计理念

Skills 采用完全不同的思路：

- 使用 **Markdown 文件** 定义技能
- 包含 **自然语言指令**、**脚本命令** 和 **工作流程**
- Agent 可以 **动态发现** 并按需应用
- 更接近"教会 Agent 做事"而非"给 Agent 工具"

```markdown
# 前端组件开发

## 触发条件
当用户要求创建 React 组件时

## 工作流程
1. 在 src/components 目录创建组件文件
2. 使用项目的 UI 框架 (shadcn/ui)
3. 添加 TypeScript 类型定义
4. 创建对应的测试文件

## 命令
- 运行测试: `pnpm test`
- 类型检查: `pnpm typecheck`
```

### 核心差异对比

| 特性 | MCP | Skills |
|------|-----|--------|
| **定义方式** | JSON Schema / 代码 | Markdown 文件 |
| **调用模式** | 函数调用 (Tool Calling) | 自然语言理解 + 脚本执行 |
| **上下文管理** | 固定的工具描述 | 动态的领域知识 |
| **适用场景** | API 集成、外部服务 | 项目规范、工作流程 |
| **灵活性** | 结构化但较死板 | 灵活但需要良好的文档 |
| **学习成本** | 需要编程能力 | 只需写 Markdown |

### 何时使用 MCP vs Skills？

**使用 MCP 的场景：**
- 需要访问外部 API（如 GitHub、Jira、数据库）
- 需要身份认证和安全边界
- 需要处理复杂的状态管理（如 Playwright 浏览器自动化）

**使用 Skills 的场景：**
- 定义项目特定的编码规范
- 描述复杂的工作流程
- 提供领域知识和最佳实践
- 创建可复用的开发模式

> **Simon Willison 的观点**：Skills 可能比 MCP 更重要。它代表了从"给 Agent 工具"到"教 Agent 做事"的范式转变。

## Skills 的使用方法

### 基本使用流程

1. **自动发现**：Agent 会自动扫描项目中的 Skills 文件
2. **按需应用**：当任务与某个 Skill 相关时，Agent 会自动应用
3. **手动调用**：可以在对话中明确引用某个 Skill

### 文件位置约定

不同工具的约定略有不同，但通用的位置包括：

```
项目根目录/
├── SKILL.md              # 全局技能（通用）
├── .claude/
│   └── skills/           # Claude Code 技能目录
├── .cursor/
│   └── skills/           # Cursor 技能目录
└── src/
    └── components/
        └── SKILL.md      # 局部技能（针对特定目录）
```

## Skills 的编写方法

### 基本结构模板

```markdown
# [技能名称]

## 描述
简要说明这个技能的用途

## 触发条件
描述何时应该使用这个技能

## 前置要求
- 依赖项
- 环境配置

## 工作流程
1. 第一步
2. 第二步
3. ...

## 命令
- `command1`: 说明
- `command2`: 说明

## 示例
提供具体的使用示例

## 注意事项
- 常见陷阱
- 最佳实践
```

### 编写原则

1. **简洁明了**：避免冗长，聚焦于 Agent 需要的信息
2. **提供替代方案**：不要只说"不要做 X"，要说"不要做 X，改用 Y"
3. **包含命令**：提供可执行的脚本和命令
4. **给出示例**：具体的代码示例比抽象描述更有效


## 实用的 Skills 资源

### 官方资源

- **[Anthropic Claude Code 文档](https://docs.anthropic.com/claude/docs/claude-code)** - Claude Code Skills 官方指南
- **[Cursor Skills 文档](https://docs.cursor.com/skills)** - Cursor 官方 Skills 文档

### 社区 Skills 仓库

- **[awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules)** - 社区收集的 Cursor Rules 和 Skills
- **[cursor.directory](https://cursor.directory/)** - Cursor 社区规则和技能目录
- **[claude-code-skills](https://github.com/anthropics/claude-code-skills)** - Claude Code 官方 Skills 示例

### 学习资源

- **[Simon Willison's Blog](https://simonwillison.net/)** - AI 工具深度分析
- **[Shrivu's Substack](https://blog.sshh.io/)** - Claude Code 使用技巧和 Skills 实践

## 实战案例

### 前端开发 Skills

#### React 组件开发

```markdown
# React 组件开发规范

## 触发条件
当用户要求创建新的 React 组件时

## 工作流程
1. 在 `src/components/` 目录下创建组件文件夹
2. 创建 `index.tsx` 作为组件主文件
3. 创建 `styles.module.css` 或使用 Tailwind
4. 创建 `types.ts` 定义 Props 类型
5. 创建 `__tests__/Component.test.tsx` 测试文件

## 代码规范
- 使用函数组件 + Hooks
- Props 使用 interface 定义，命名为 `ComponentNameProps`
- 导出方式：`export { ComponentName }`

## 命令
- 运行测试: `pnpm test --watch`
- 类型检查: `pnpm typecheck`
- Lint: `pnpm lint`

## 示例
```tsx
// Button/index.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button className={styles[variant]} onClick={onClick}>
      {children}
    </button>
  );
}
```

## 注意事项
- 不要使用 `any` 类型
- 组件必须有对应的单元测试
- 使用项目统一的 UI 组件库 (shadcn/ui)
```

### 工具类 Skills

#### Git 工作流

```markdown
# Git 提交规范

## 触发条件
当用户要求提交代码或创建 PR 时

## Commit 格式
```
<type>(<scope>): <subject>

<body>
```

### Type 类型
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

## 工作流程
1. 运行 `pnpm lint` 确保代码规范
2. 运行 `pnpm test` 确保测试通过
3. 使用规范格式编写 commit message
4. 推送到功能分支
5. 创建 PR 并填写模板

## 命令
- 提交: `git commit -m "type(scope): message"`
- 推送: `git push origin feature/xxx`

## 注意事项
- 每个 commit 只做一件事
- commit message 使用中文或英文，保持一致
- 不要提交敏感信息（API Key 等）
```

### 后端开发 Skills

#### API 接口开发

```markdown
# REST API 开发规范

## 触发条件
当用户要求创建新的 API 接口时

## 工作流程
1. 在 `src/api/` 目录创建路由文件
2. 定义请求/响应的 TypeScript 类型
3. 实现业务逻辑
4. 添加参数校验 (zod/joi)
5. 编写 API 测试
6. 更新 API 文档

## 代码结构
```
src/api/
├── users/
│   ├── routes.ts      # 路由定义
│   ├── handlers.ts    # 请求处理
│   ├── schemas.ts     # 参数校验
│   ├── services.ts    # 业务逻辑
│   └── tests/
│       └── users.test.ts
```

## 响应格式
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

## 错误处理
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "用户不存在"
  }
}
```

## 命令
- 启动开发服务器: `pnpm dev`
- 运行 API 测试: `pnpm test:api`
- 生成 API 文档: `pnpm docs:api`

## 注意事项
- 所有接口必须有参数校验
- 敏感操作需要权限验证
- 数据库操作使用事务
- 错误要有明确的错误码
```

## 高级技巧

### 1. Skills 作为强制函数

> 如果你的 CLI 命令很复杂，不要写一堆文档来解释它。写一个简单的 bash wrapper，然后在 Skills 里文档化这个简单的命令。保持 Skills 简短是简化代码库的好方法。

### 2. 分层组织 Skills

```
.cursor/skills/
├── global/
│   ├── git-workflow.md
│   └── code-style.md
├── frontend/
│   ├── react-components.md
│   └── testing.md
└── backend/
    ├── api-development.md
    └── database.md
```

### 3. 与 CLAUDE.md / .cursorrules 配合

- **CLAUDE.md / .cursorrules**：始终加载的全局规则（"必须做"）
- **Skills**：按需加载的操作指南（"如何做"）

两者配合使用，效果最佳。

## 总结

Agent Skills 代表了 AI 编程工具的一个重要演进方向：

1. **更自然**：用 Markdown 而非代码定义能力
2. **更灵活**：按需加载，不占用固定上下文
3. **更可维护**：团队可以共享和迭代 Skills
4. **更强大**：结合 MCP 形成完整的 Agent 生态

开始使用 Skills 的最佳方式是：**从你遇到的实际问题出发**。当 Agent 做错了什么，就把正确的做法写成一个 Skill。随着时间推移，你的 Skills 库会成为团队的宝贵资产。

