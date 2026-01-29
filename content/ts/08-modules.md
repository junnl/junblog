+++
date = '2026-01-27T10:08:00+08:00'
draft = false
title = '08. 模块与声明文件'
weight = 8
+++

# 模块与声明文件

## ES 模块语法

TypeScript 完全支持 ES6 模块语法：

```typescript
// math.ts - 导出
export const PI = 3.14159;

export function add(a: number, b: number): number {
  return a + b;
}

export default class Calculator {
  // ...
}

// main.ts - 导入
import Calculator, { PI, add } from "./math";
import * as MathUtils from "./math";

console.log(PI);           // 3.14159
console.log(add(1, 2));    // 3
console.log(MathUtils.PI); // 3.14159
```

## 类型导入导出

```typescript
// types.ts
export interface User {
  id: number;
  name: string;
}

export type ID = number | string;

// main.ts - 类型导入
import type { User, ID } from "./types";

// 混合导入
import { someFunction, type SomeType } from "./module";
```

### 为什么用 `import type`？

- 编译后会被完全移除
- 明确表示只用于类型检查
- 避免循环依赖问题

## 模块解析

### tsconfig.json 配置

```json
{
  "compilerOptions": {
    "module": "ESNext",           // 模块系统
    "moduleResolution": "bundler", // 解析策略
    "baseUrl": "./src",           // 基础路径
    "paths": {                    // 路径别名
      "@/*": ["./*"],
      "@components/*": ["components/*"]
    }
  }
}
```

### 路径别名使用

```typescript
// 不用别名
import { Button } from "../../../components/Button";

// 使用别名
import { Button } from "@components/Button";
```

## 声明文件（.d.ts）

声明文件用于描述 JavaScript 库的类型。

### 为什么需要声明文件？

```typescript
// 使用没有类型的 JS 库
import lodash from "lodash";
lodash.chunk([1, 2, 3], 2); // ❌ 没有类型提示

// 安装类型声明后
npm install @types/lodash --save-dev
lodash.chunk([1, 2, 3], 2); // ✅ 有类型提示
```

### 声明文件语法

```typescript
// global.d.ts - 全局声明
declare const VERSION: string;
declare function log(message: string): void;

// 声明模块
declare module "some-js-library" {
  export function doSomething(): void;
  export const version: string;
}

// 扩展已有模块
declare module "express" {
  interface Request {
    user?: User;
  }
}
```

### 编写自己的声明文件

```typescript
// utils.d.ts
export declare function formatDate(date: Date): string;
export declare function parseDate(str: string): Date;

export interface Config {
  apiUrl: string;
  timeout: number;
}

export declare const defaultConfig: Config;
```

## 三斜线指令

```typescript
/// <reference types="node" />
/// <reference path="./types.d.ts" />

// 现代项目中很少使用，推荐用 import
```

## 命名空间（Namespace）

早期 TypeScript 的模块化方案，现在主要用于声明文件：

```typescript
// 声明文件中使用
declare namespace MyLib {
  interface Config {
    debug: boolean;
  }
  
  function init(config: Config): void;
}

// 使用
MyLib.init({ debug: true });
```

## 常见场景

### 1. 为 JS 文件添加类型

```typescript
// utils.js
export function add(a, b) {
  return a + b;
}

// utils.d.ts
export declare function add(a: number, b: number): number;
```

### 2. 声明全局变量

```typescript
// global.d.ts
declare global {
  interface Window {
    myApp: {
      version: string;
      init(): void;
    };
  }
}

export {}; // 使文件成为模块

// 使用
window.myApp.init();
```

### 3. 声明环境变量

```typescript
// env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production";
    API_URL: string;
    PORT?: string;
  }
}

// 使用
process.env.NODE_ENV; // 有类型提示
```

### 4. 声明静态资源

```typescript
// assets.d.ts
declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.css" {
  const classes: { [key: string]: string };
  export default classes;
}
```

## DefinitelyTyped

社区维护的类型声明仓库：

```bash
# 安装第三方库的类型
npm install @types/lodash --save-dev
npm install @types/node --save-dev
npm install @types/react --save-dev
```

查找类型包：https://www.typescriptlang.org/dt/search

## 小结

| 概念 | 用途 | 示例 |
|------|------|------|
| `export/import` | ES 模块 | `export { foo }` |
| `import type` | 仅导入类型 | `import type { User }` |
| `.d.ts` | 声明文件 | `declare function` |
| `@types/*` | 社区类型包 | `@types/lodash` |
| `declare` | 声明类型 | `declare const x: number` |
| `namespace` | 命名空间 | `namespace MyLib {}` |

---

下一章：[Vue/React 实战](../09-frameworks/) →

