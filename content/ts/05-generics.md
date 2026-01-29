+++
date = '2026-01-27T10:05:00+08:00'
draft = false
title = '05. 泛型'
weight = 5
+++

# 泛型

泛型是 TypeScript 最强大的特性之一，类似 Java/C# 的泛型。

## 为什么需要泛型？

```typescript
// 问题：想写一个通用的函数，但类型信息丢失了
function identity(value: any): any {
  return value;
}

const result = identity(42); // result 是 any，不是 number

// 解决：使用泛型保持类型关系
function identity<T>(value: T): T {
  return value;
}

const result = identity(42);      // result 是 number
const result2 = identity("hello"); // result2 是 string
```

## 泛型函数

```typescript
// 基本语法：<T> 声明类型参数
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

first([1, 2, 3]);     // number | undefined
first(["a", "b"]);    // string | undefined

// 多个类型参数
function pair<K, V>(key: K, value: V): [K, V] {
  return [key, value];
}

pair("name", "张三");  // [string, string]
pair(1, true);         // [number, boolean]

// 显式指定类型
pair<string, number>("age", 25);
```

## 泛型接口

```typescript
// 泛型接口
interface Container<T> {
  value: T;
  getValue(): T;
}

const numContainer: Container<number> = {
  value: 42,
  getValue() { return this.value; }
};

// API 响应泛型
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface User { id: number; name: string; }

type UserResponse = ApiResponse<User>;
type UserListResponse = ApiResponse<User[]>;
```

## 泛型类

```typescript
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }
}

const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
numberStack.pop(); // 2

const stringStack = new Stack<string>();
stringStack.push("hello");
```

## 泛型约束

限制泛型必须满足某些条件：

```typescript
// 约束：T 必须有 length 属性
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(value: T): void {
  console.log(value.length);
}

logLength("hello");     // ✅ 字符串有 length
logLength([1, 2, 3]);   // ✅ 数组有 length
logLength({ length: 5 }); // ✅ 对象有 length
// logLength(123);      // ❌ 数字没有 length

// 约束：K 必须是 T 的键
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "张三", age: 25 };
getProperty(user, "name"); // ✅ "张三"
// getProperty(user, "email"); // ❌ "email" 不是 user 的键
```

## 泛型默认值

```typescript
interface PaginatedResult<T = any> {
  data: T[];
  total: number;
  page: number;
}

// 不指定类型时使用默认值
const result: PaginatedResult = { data: [], total: 0, page: 1 };

// 指定类型
const userResult: PaginatedResult<User> = { data: [], total: 0, page: 1 };
```

## 内置工具类型

TypeScript 提供了很多基于泛型的工具类型：

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
}

// Partial<T> - 所有属性变为可选
type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; age?: number; }

// Required<T> - 所有属性变为必选
type RequiredUser = Required<User>;
// { id: number; name: string; email: string; age: number; }

// Readonly<T> - 所有属性变为只读
type ReadonlyUser = Readonly<User>;

// Pick<T, K> - 选取部分属性
type UserBasic = Pick<User, "id" | "name">;
// { id: number; name: string; }

// Omit<T, K> - 排除部分属性
type UserWithoutEmail = Omit<User, "email">;
// { id: number; name: string; age?: number; }

// Record<K, V> - 构造对象类型
type UserMap = Record<string, User>;
// { [key: string]: User }
```

## 实战示例

```typescript
// 通用的 API 请求函数
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// 使用时指定返回类型
interface User { id: number; name: string; }

const user = await request<User>("/api/user/1");
// user 的类型是 User

const users = await request<User[]>("/api/users");
// users 的类型是 User[]
```

## 小结

| 概念 | 语法 | 示例 |
|------|------|------|
| 泛型函数 | `function f<T>()` | `function identity<T>(x: T): T` |
| 泛型接口 | `interface I<T>` | `interface Container<T>` |
| 泛型类 | `class C<T>` | `class Stack<T>` |
| 泛型约束 | `T extends X` | `T extends HasLength` |
| 默认类型 | `T = Default` | `T = any` |
| `Partial<T>` | 全部可选 | `Partial<User>` |
| `Required<T>` | 全部必选 | `Required<User>` |
| `Pick<T, K>` | 选取属性 | `Pick<User, "id">` |
| `Omit<T, K>` | 排除属性 | `Omit<User, "email">` |

---

下一章：[类与面向对象](../06-classes/) →

