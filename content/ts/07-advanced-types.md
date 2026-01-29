+++
date = '2026-01-27T10:07:00+08:00'
draft = false
title = '07. 高级类型'
weight = 7
+++

# 高级类型

本章介绍 TypeScript 的高级类型特性，这是 TS 类型系统的精华。

## 联合类型（Union Types）

表示"或"的关系：

```typescript
// 基本联合类型
type ID = number | string;

let userId: ID = 123;
userId = "abc"; // 也可以

// 字面量联合类型
type Status = "pending" | "approved" | "rejected";
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

function request(method: HttpMethod, url: string) {
  // method 只能是这四个值之一
}

request("GET", "/api/users");  // ✅
// request("PATCH", "/api");   // ❌ 错误
```

## 类型收窄（Type Narrowing）

```typescript
function printId(id: number | string) {
  // 类型守卫
  if (typeof id === "string") {
    console.log(id.toUpperCase()); // 这里 id 是 string
  } else {
    console.log(id.toFixed(2));    // 这里 id 是 number
  }
}

// in 操作符收窄
interface Bird { fly(): void; }
interface Fish { swim(): void; }

function move(animal: Bird | Fish) {
  if ("fly" in animal) {
    animal.fly();  // Bird
  } else {
    animal.swim(); // Fish
  }
}

// instanceof 收窄
function logDate(date: Date | string) {
  if (date instanceof Date) {
    console.log(date.toISOString());
  } else {
    console.log(date);
  }
}
```

## 交叉类型（Intersection Types）

表示"且"的关系：

```typescript
interface Name { name: string; }
interface Age { age: number; }

type Person = Name & Age;

const person: Person = {
  name: "张三",
  age: 25
};

// 实际应用：混入模式
interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

interface SoftDeletable {
  deletedAt: Date | null;
}

type Entity<T> = T & Timestamped & SoftDeletable;

type User = Entity<{ id: number; name: string }>;
// { id: number; name: string; createdAt: Date; updatedAt: Date; deletedAt: Date | null }
```

## 类型别名 vs 接口（深入）

```typescript
// 联合类型只能用 type
type Result = Success | Error;

// 交叉类型
type Combined = A & B;

// 接口可以声明合并
interface User { name: string; }
interface User { age: number; }
// 合并为 { name: string; age: number; }
```

## 条件类型（Conditional Types）

类似三元表达式的类型：

```typescript
// 基本语法：T extends U ? X : Y
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;  // false

// 实际应用：提取数组元素类型
type ElementType<T> = T extends (infer E)[] ? E : T;

type A = ElementType<string[]>;  // string
type B = ElementType<number>;    // number

// 提取函数返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function foo() { return { x: 1, y: "hello" }; }
type FooReturn = ReturnType<typeof foo>; // { x: number; y: string }
```

## 映射类型（Mapped Types）

基于已有类型创建新类型：

```typescript
// 基本语法
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

type Partial<T> = {
  [K in keyof T]?: T[K];
};

// 使用
interface User {
  id: number;
  name: string;
}

type ReadonlyUser = Readonly<User>;
// { readonly id: number; readonly name: string; }

// 键重映射（as 子句）
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<User>;
// { getId: () => number; getName: () => string; }
```

## 模板字面量类型

```typescript
type EventName = "click" | "focus" | "blur";
type Handler = `on${Capitalize<EventName>}`;
// "onClick" | "onFocus" | "onBlur"

// 组合
type Vertical = "top" | "bottom";
type Horizontal = "left" | "right";
type Position = `${Vertical}-${Horizontal}`;
// "top-left" | "top-right" | "bottom-left" | "bottom-right"
```

## 内置工具类型（进阶）

```typescript
// Exclude<T, U> - 从 T 中排除 U
type T1 = Exclude<"a" | "b" | "c", "a">;  // "b" | "c"

// Extract<T, U> - 从 T 中提取 U
type T2 = Extract<"a" | "b" | "c", "a" | "f">;  // "a"

// NonNullable<T> - 排除 null 和 undefined
type T3 = NonNullable<string | null | undefined>;  // string

// Parameters<T> - 获取函数参数类型
type T4 = Parameters<(a: number, b: string) => void>;  // [number, string]

// ReturnType<T> - 获取函数返回类型
type T5 = ReturnType<() => string>;  // string

// InstanceType<T> - 获取构造函数实例类型
class User { name = ""; }
type T6 = InstanceType<typeof User>;  // User
```

## 类型断言函数

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error("Not a string!");
  }
}

function process(value: unknown) {
  assertIsString(value);
  // 这里 value 的类型是 string
  console.log(value.toUpperCase());
}
```

## 实战：API 类型定义

```typescript
// 定义 API 响应的通用类型
type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// 根据响应类型自动推断
function handleResponse<T>(response: ApiResponse<T>) {
  if (response.success) {
    return response.data;  // T
  } else {
    throw new Error(response.error);
  }
}
```

## 小结

| 类型 | 语法 | 说明 |
|------|------|------|
| 联合类型 | `A \| B` | 或关系 |
| 交叉类型 | `A & B` | 且关系 |
| 条件类型 | `T extends U ? X : Y` | 条件判断 |
| 映射类型 | `{ [K in keyof T]: ... }` | 遍历转换 |
| 模板字面量 | `` `${A}-${B}` `` | 字符串组合 |
| `infer` | `T extends (infer U)[]` | 类型推断 |

---

下一章：[模块与声明文件](../08-modules/) →

