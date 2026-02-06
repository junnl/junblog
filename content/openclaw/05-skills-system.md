+++
title = "OpenClaw 系列（五）：Skills 系统与 MCP 协议集成"
date = 2026-02-01
description = "解析 OpenClaw Skills 架构：SKILL.md 格式、加载机制、Gating 规则、ClawHub 生态"
[taxonomies]
tags = ["OpenClaw", "Skills", "MCP", "扩展", "后端"]
+++

## 前言

Skills 是 OpenClaw 的扩展机制，允许通过 Markdown 文件定义 Agent 能力。本文分析其实现原理。

## Skill 文件格式

```markdown
---
name: web-search
version: 1.0.0
description: Search the web using Google Custom Search API
homepage: https://github.com/example/web-search-skill
metadata:
  openclaw:
    emoji: "🔍"
    requires:
      env: [GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_CX]
      bins: []
      config: []
    os: [darwin, linux, win32]
---

# Web Search Skill

When the user asks to search the web:

1. Use the `web_search` tool with the query
2. Parse the top 5 results
3. Summarize findings in a concise format

## Examples

User: "Search for TypeScript best practices"
Action: Call web_search("TypeScript best practices 2026")

## Limitations

- Rate limited to 100 queries/day
- Results may not include paywalled content
```

## Frontmatter 解析

```typescript
// src/agents/skills/frontmatter.ts
import matter from "gray-matter";

interface SkillFrontmatter {
  name: string;
  version?: string;
  description?: string;
  homepage?: string;
  metadata?: {
    openclaw?: {
      emoji?: string;
      requires?: {
        env?: string[];
        bins?: string[];
        config?: string[];
      };
      os?: string[];
      install?: InstallOption[];
    };
  };
}

export function parseSkillFile(content: string): ParsedSkill {
  const { data, content: body } = matter(content);
  
  return {
    frontmatter: data as SkillFrontmatter,
    instructions: body.trim(),
  };
}
```

## 加载优先级

```typescript
// src/agents/skills/workspace.ts
const SKILL_SEARCH_PATHS = [
  // 1. 工作区 Skills（最高优先级）
  path.join(workspacePath, "skills"),
  
  // 2. 用户管理的 Skills
  path.join(homedir(), ".openclaw", "skills"),
  
  // 3. 内置 Skills（最低优先级）
  path.join(__dirname, "bundled-skills"),
];

export async function loadSkills(
  workspacePath: string
): Promise<Map<string, Skill>> {
  const skills = new Map();
  
  for (const searchPath of SKILL_SEARCH_PATHS) {
    const skillDirs = await fs.readdir(searchPath);
    
    for (const dir of skillDirs) {
      const skillPath = path.join(searchPath, dir, "SKILL.md");
      
      if (await fs.exists(skillPath)) {
        const content = await fs.readFile(skillPath, "utf-8");
        const skill = parseSkillFile(content);
        
        // 低优先级不覆盖高优先级
        if (!skills.has(skill.frontmatter.name)) {
          skills.set(skill.frontmatter.name, skill);
        }
      }
    }
  }
  
  return skills;
}
```

## Gating 规则

```typescript
// 检查 Skill 是否可用
export function checkSkillGating(
  skill: Skill,
  context: GatingContext
): GatingResult {
  const requires = skill.frontmatter.metadata?.openclaw?.requires;
  const osFilter = skill.frontmatter.metadata?.openclaw?.os;
  
  // 检查操作系统
  if (osFilter && !osFilter.includes(process.platform)) {
    return { available: false, reason: `OS not supported: ${process.platform}` };
  }
  
  // 检查环境变量
  if (requires?.env) {
    for (const envVar of requires.env) {
      if (!process.env[envVar]) {
        return { available: false, reason: `Missing env: ${envVar}` };
      }
    }
  }
  
  // 检查二进制依赖
  if (requires?.bins) {
    for (const bin of requires.bins) {
      if (!which.sync(bin, { nothrow: true })) {
        return { available: false, reason: `Missing binary: ${bin}` };
      }
    }
  }
  
  return { available: true };
}
```

## ClawHub 集成

```bash
# 从 ClawHub 安装 Skill
openclaw skills add web-search

# 列出已安装 Skills
openclaw skills list

# 更新所有 Skills
openclaw skills update
```

```typescript
// ClawHub API 交互
const CLAWHUB_API = "https://api.clawhub.com/v1";

export async function installSkill(skillName: string) {
  // 获取 Skill 元数据
  const meta = await fetch(`${CLAWHUB_API}/skills/${skillName}`);
  const { tarballUrl, version } = await meta.json();
  
  // 下载并解压
  const tarball = await fetch(tarballUrl);
  const targetDir = path.join(homedir(), ".openclaw", "skills", skillName);
  
  await extractTarball(tarball, targetDir);
  
  console.log(`Installed ${skillName}@${version}`);
}
```

## MCP 协议支持

```typescript
// MCP 服务器集成
interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

// 配置示例
{
  mcp: {
    servers: {
      "filesystem": {
        command: "npx",
        args: ["-y", "@anthropic/mcp-server-filesystem", "/path/to/dir"],
      },
      "github": {
        command: "npx",
        args: ["-y", "@anthropic/mcp-server-github"],
        env: { GITHUB_TOKEN: "${GITHUB_TOKEN}" },
      },
    }
  }
}
```

## Skill 注入系统提示

```typescript
// 将 Skills 注入 Agent 系统提示
function buildSystemPrompt(
  basePrompt: string,
  skills: Skill[]
): string {
  const skillInstructions = skills
    .filter(s => checkSkillGating(s, context).available)
    .map(s => `## ${s.frontmatter.name}\n${s.instructions}`)
    .join("\n\n");
  
  return `${basePrompt}

# Available Skills

${skillInstructions}`;
}
```

## 下篇预告

下一篇将分析记忆与上下文管理系统，理解 OpenClaw 如何处理长期记忆。

---

**系列文章导航**：
1. ✅ OpenClaw 快速入门与 Docker 部署指南
2. ✅ 深入理解 Gateway 架构设计
3. ✅ 源码解析 - Gateway 核心实现
4. ✅ 多渠道消息集成机制
5. ✅ Skills 系统与 MCP 协议集成（本文）
6. 记忆与上下文管理系统
7. 安全模型与沙箱机制
8. Pi Agent 运行时深度剖析
9. 生产环境部署与运维
10. 架构创新与不足总结

