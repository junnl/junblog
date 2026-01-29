+++
date = '2026-01-27T10:01:00+08:00'
draft = false
title = '01. TypeScript 简介与环境搭建'
weight = 1
+++

# TypeScript 简介与环境搭建

## 什么是 TypeScript？

TypeScript 是 JavaScript 的**超集**，由微软开发。简单说：

```
TypeScript = JavaScript + 类型系统
```

作为后端开发者，你可以这样理解：
- **Java/C#** 是静态类型语言 → 编译时检查类型
- **JavaScript** 是动态类型语言 → 运行时才知道类型
- **TypeScript** 是 JS 的静态类型版本 → 编译时检查，运行时还是 JS

## 为什么需要 TypeScript？

### 1. 类型安全

```javascript
// JavaScript - 运行时才报错
function add(a, b) {
  return a + b;
}
add("1", 2); // "12" - 字符串拼接，不是你想要的
```

```typescript
// TypeScript - 编译时就报错
function add(a: number, b: number): number {
  return a + b;
}
add("1", 2); // ❌ 编译错误：类型"string"不能赋值给类型"number"
```

### 2. 智能提示

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = { id: 1, name: "张三", email: "test@example.com" };
user. // IDE 自动提示：id, name, email
```

### 3. 重构友好

改一个接口字段，所有使用的地方都会报错提示，不会遗漏。

## 环境搭建

### 方式一：全局安装（推荐学习用）

```bash
# 安装 TypeScript 编译器
npm install -g typescript

# 验证安装
tsc --version
# 输出：Version 5.x.x
```

### 方式二：项目级安装（推荐生产用）

```bash
mkdir ts-learning && cd ts-learning
npm init -y
npm install typescript --save-dev

# 初始化 tsconfig.json
npx tsc --init
```

## 第一个 TypeScript 程序

创建 `hello.ts`：

```typescript
// hello.ts
function greet(name: string): string {
  return `Hello, ${name}!`;
}

const message = greet("TypeScript");
console.log(message);
```

编译并运行：

```bash
# 编译 TS → JS
tsc hello.ts

# 运行生成的 JS
node hello.js
# 输出：Hello, TypeScript!
```

## tsconfig.json 基础配置

运行 `tsc --init` 会生成配置文件，关键选项：

```json
{
  "compilerOptions": {
    "target": "ES2020",        // 编译目标版本
    "module": "commonjs",      // 模块系统
    "strict": true,            // 严格模式（推荐开启）
    "outDir": "./dist",        // 输出目录
    "rootDir": "./src",        // 源码目录
    "esModuleInterop": true,   // ES 模块兼容
    "skipLibCheck": true       // 跳过声明文件检查
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## 快速开发：ts-node

每次都要编译再运行太麻烦？用 `ts-node` 直接运行 TS：

```bash
npm install -g ts-node

# 直接运行 TS 文件
ts-node hello.ts
```

## 与后端语言对比

| 概念 | TypeScript | Java | C# |
|------|------------|------|-----|
| 类型声明 | `let x: number` | `int x` | `int x` |
| 接口 | `interface` | `interface` | `interface` |
| 泛型 | `Array<T>` | `List<T>` | `List<T>` |
| 空值 | `null \| undefined` | `null` | `null` |
| 类型推断 | ✅ 强大 | ⚠️ 有限 | ✅ `var` |

## 小结

- TypeScript = JavaScript + 静态类型
- 使用 `tsc` 编译，或 `ts-node` 直接运行
- `tsconfig.json` 控制编译行为
- 开启 `strict: true` 获得最佳类型检查

---

下一章：[基础类型系统](../02-basic-types/) →

