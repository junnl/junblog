+++
date = '2026-01-27T10:13:00+08:00'
draft = false
title = '13. 类型守卫进阶'
weight = 13
+++

# 类型守卫进阶

类型守卫是 TypeScript 类型收窄的核心机制，本章深入讲解高级用法。

## 内置类型守卫回顾

```typescript
function process(value: string | number | null) {
  // typeof 守卫
  if (typeof value === "string") {
    console.log(value.toUpperCase()); // string
  }
  
  // 真值检查
  if (value) {
    console.log(value); // string | number
  }
  
  // 相等性检查
  if (value === null) {
    console.log("is null");
  }
}

// instanceof 守卫
function handleError(error: Error | string) {
  if (error instanceof Error) {
    console.log(error.message); // Error
  } else {
    console.log(error); // string
  }
}

// in 操作符
interface Bird { fly(): void; }
interface Fish { swim(): void; }

function move(animal: Bird | Fish) {
  if ("fly" in animal) {
    animal.fly(); // Bird
  } else {
    animal.swim(); // Fish
  }
}
```

## 自定义类型守卫（is）

使用 `is` 关键字定义类型谓词：

```typescript
// 基本语法：paramName is Type
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

// 使用
function process(value: unknown) {
  if (isString(value)) {
    console.log(value.toUpperCase()); // value 是 string
  } else if (isNumber(value)) {
    console.log(value.toFixed(2)); // value 是 number
  }
}
```

### 对象类型守卫

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

interface Admin extends User {
  role: "admin";
  permissions: string[];
}

// 检查是否为 User
function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    "email" in value &&
    typeof (value as User).id === "number" &&
    typeof (value as User).name === "string"
  );
}

// 检查是否为 Admin
function isAdmin(user: User): user is Admin {
  return "role" in user && (user as Admin).role === "admin";
}

// 使用
function handleUser(data: unknown) {
  if (isUser(data)) {
    console.log(data.name); // User
    if (isAdmin(data)) {
      console.log(data.permissions); // Admin
    }
  }
}
```

### 数组类型守卫

```typescript
// 检查是否为特定类型的数组
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(item => typeof item === "number");
}

// 泛型数组守卫
function isArrayOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

// 使用
const data: unknown = ["a", "b", "c"];
if (isArrayOf(data, isString)) {
  console.log(data.join(", ")); // string[]
}
```

## 断言函数（asserts）

断言函数在条件不满足时抛出错误：

```typescript
// 基本语法：asserts condition
function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message ?? "Assertion failed");
  }
}

// 使用
function process(value: string | null) {
  assert(value !== null, "Value cannot be null");
  console.log(value.toUpperCase()); // value 是 string
}
```

### 断言类型

```typescript
// asserts value is Type
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error("Expected string");
  }
}

function assertIsUser(value: unknown): asserts value is User {
  if (!isUser(value)) {
    throw new Error("Expected User object");
  }
}

// 使用
function processUser(data: unknown) {
  assertIsUser(data);
  // 这里 data 的类型是 User
  console.log(data.name);
  console.log(data.email);
}
```

### 非空断言

```typescript
// 断言非空
function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? "Value is null or undefined");
  }
}

// 使用
function getUser(id: number): User | null {
  return db.find(id);
}

const user = getUser(1);
assertDefined(user, "User not found");
console.log(user.name); // user 是 User，不是 User | null
```

## 判别联合类型

使用共同属性区分类型：

```typescript
// 定义判别联合
interface Circle {
  kind: "circle";
  radius: number;
}

interface Rectangle {
  kind: "rectangle";
  width: number;
  height: number;
}

interface Triangle {
  kind: "triangle";
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;

// 使用 kind 属性判别
function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
  }
}

// 穷尽性检查
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

function getAreaExhaustive(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      return assertNever(shape); // 如果漏掉某个 case，这里会报错
  }
}
```

## 实战：API 响应处理

```typescript
// API 响应类型
type ApiResponse<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: string }
  | { status: "loading" };

// 类型守卫
function isSuccess<T>(res: ApiResponse<T>): res is { status: "success"; data: T } {
  return res.status === "success";
}

function isError<T>(res: ApiResponse<T>): res is { status: "error"; error: string } {
  return res.status === "error";
}

// 使用
function handleResponse<T>(response: ApiResponse<T>) {
  if (isSuccess(response)) {
    console.log(response.data); // T
  } else if (isError(response)) {
    console.log(response.error); // string
  } else {
    console.log("Loading...");
  }
}
```

## 小结

| 类型守卫 | 语法 | 用途 |
|----------|------|------|
| `typeof` | `typeof x === "string"` | 原始类型检查 |
| `instanceof` | `x instanceof Error` | 类实例检查 |
| `in` | `"prop" in obj` | 属性存在检查 |
| `is` | `value is Type` | 自定义类型谓词 |
| `asserts` | `asserts value is Type` | 断言函数 |
| 判别联合 | `switch (x.kind)` | 联合类型区分 |

---

下一章：[装饰器](../14-decorators/) →

