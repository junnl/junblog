+++
date = '2026-01-27T10:10:00+08:00'
draft = false
title = '10. 最佳实践与常见问题'
weight = 10
+++

# 最佳实践与常见问题

## tsconfig.json 推荐配置

```json
{
  "compilerOptions": {
    // 严格模式（强烈推荐）
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    // 现代 JS 特性
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,

    // 路径配置
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    },

    // 输出配置
    "outDir": "./dist",
    "declaration": true,
    "sourceMap": true,

    // 其他
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 类型定义最佳实践

### 1. 优先使用 interface

```typescript
// ✅ 推荐：对象结构用 interface
interface User {
  id: number;
  name: string;
}

// ✅ 联合类型用 type
type Status = "active" | "inactive";

// ✅ 工具类型用 type
type PartialUser = Partial<User>;
```

### 2. 避免 any，使用 unknown

```typescript
// ❌ 避免
function parse(json: string): any {
  return JSON.parse(json);
}

// ✅ 推荐
function parse(json: string): unknown {
  return JSON.parse(json);
}

// 使用时进行类型检查
const data = parse('{"name": "test"}');
if (isUser(data)) {
  console.log(data.name);
}
```

### 3. 使用类型守卫

```typescript
// 类型谓词
function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value
  );
}

// 使用
function process(data: unknown) {
  if (isUser(data)) {
    console.log(data.name); // 类型安全
  }
}
```

### 4. 使用 const 断言

```typescript
// 普通对象
const config = {
  api: "/api",
  timeout: 5000
}; // { api: string; timeout: number }

// const 断言 - 更精确的类型
const config = {
  api: "/api",
  timeout: 5000
} as const; // { readonly api: "/api"; readonly timeout: 5000 }

// 数组
const colors = ["red", "green", "blue"] as const;
type Color = typeof colors[number]; // "red" | "green" | "blue"
```

## 常见错误与解决

### 1. 对象可能为 undefined

```typescript
// ❌ 错误
const user = users.find(u => u.id === 1);
console.log(user.name); // 对象可能为 undefined

// ✅ 解决方案 1：可选链
console.log(user?.name);

// ✅ 解决方案 2：类型守卫
if (user) {
  console.log(user.name);
}

// ✅ 解决方案 3：非空断言（确定不为空时）
console.log(user!.name);
```

### 2. 类型不兼容

```typescript
// ❌ 错误
interface A { x: number; }
interface B { x: number; y: string; }

const a: A = { x: 1 };
const b: B = a; // 缺少属性 y

// ✅ 解决：使用类型断言或扩展
const b: B = { ...a, y: "hello" };
```

### 3. 索引签名问题

```typescript
// ❌ 错误
interface User {
  name: string;
  [key: string]: string; // name 必须也是 string
}

// ✅ 解决
interface User {
  name: string;
  [key: string]: string | number;
}

// 或使用 Record
type UserExtras = Record<string, string>;
interface User {
  name: string;
  extras?: UserExtras;
}
```

## 实用类型技巧

### 1. 从对象提取类型

```typescript
const user = {
  id: 1,
  name: "张三",
  email: "test@example.com"
};

type User = typeof user;
// { id: number; name: string; email: string }
```

### 2. 从数组提取元素类型

```typescript
const users = [
  { id: 1, name: "张三" },
  { id: 2, name: "李四" }
];

type User = typeof users[number];
// { id: number; name: string }
```

### 3. 从函数提取类型

```typescript
function createUser(name: string, age: number) {
  return { name, age, createdAt: new Date() };
}

type User = ReturnType<typeof createUser>;
type CreateUserParams = Parameters<typeof createUser>;
```

### 4. 深度 Partial

```typescript
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

interface Config {
  server: {
    host: string;
    port: number;
  };
  debug: boolean;
}

type PartialConfig = DeepPartial<Config>;
// 所有嵌套属性都变为可选
```

## 性能优化

### 1. 使用 skipLibCheck

```json
{
  "compilerOptions": {
    "skipLibCheck": true  // 跳过 .d.ts 文件检查，加快编译
  }
}
```

### 2. 使用项目引用

```json
// tsconfig.json
{
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/ui" }
  ]
}
```

### 3. 增量编译

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo"
  }
}
```

## 学习资源

| 资源 | 链接 |
|------|------|
| 官方文档 | https://www.typescriptlang.org/docs/ |
| TypeScript 练习 | https://typescript-exercises.github.io/ |
| 类型挑战 | https://github.com/type-challenges/type-challenges |
| TS Playground | https://www.typescriptlang.org/play |

## 总结

1. **开启 strict 模式** - 获得最佳类型检查
2. **避免 any** - 使用 unknown + 类型守卫
3. **善用工具类型** - Partial、Pick、Omit 等
4. **类型即文档** - 好的类型定义胜过注释
5. **渐进式采用** - 可以逐步迁移 JS 项目

---

🎉 恭喜你完成了 TypeScript 教程！

返回 [教程目录](../) | 开始 [第一章](../01-introduction/)

