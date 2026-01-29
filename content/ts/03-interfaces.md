+++
date = '2026-01-27T10:03:00+08:00'
draft = false
title = '03. 接口与类型别名'
weight = 3
+++

# 接口与类型别名

## 接口（Interface）

接口用于定义对象的结构，类似 Java/C# 的接口：

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: "张三",
  email: "zhangsan@example.com"
};
```

### 可选属性

```typescript
interface Config {
  host: string;
  port: number;
  timeout?: number;  // 可选
}

const config: Config = {
  host: "localhost",
  port: 3000
  // timeout 可以不写
};
```

### 只读属性

```typescript
interface Point {
  readonly x: number;
  readonly y: number;
}

const p: Point = { x: 10, y: 20 };
// p.x = 5; // ❌ 错误：无法分配到 "x" ，因为它是只读属性
```

### 索引签名

当你不确定对象有哪些属性时：

```typescript
interface StringMap {
  [key: string]: string;
}

const headers: StringMap = {
  "Content-Type": "application/json",
  "Authorization": "Bearer xxx"
};

// 数字索引
interface NumberArray {
  [index: number]: string;
}
const arr: NumberArray = ["a", "b", "c"];
```

### 接口继承

```typescript
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}

const dog: Dog = {
  name: "旺财",
  breed: "柴犬"
};

// 多继承
interface Pet extends Animal, Movable {
  owner: string;
}
```

## 类型别名（Type Alias）

使用 `type` 关键字定义类型别名：

```typescript
type ID = number | string;
type Point = { x: number; y: number };

let userId: ID = 123;
userId = "abc";  // 也可以

const point: Point = { x: 10, y: 20 };
```

### 联合类型

```typescript
type Status = "pending" | "approved" | "rejected";

function setStatus(status: Status) {
  // status 只能是这三个值之一
}

setStatus("pending");   // ✅
setStatus("unknown");   // ❌ 错误
```

### 交叉类型

```typescript
type Name = { name: string };
type Age = { age: number };
type Person = Name & Age;

const person: Person = {
  name: "张三",
  age: 25
};
```

## Interface vs Type

### 相同点

```typescript
// 都可以描述对象
interface IUser { name: string; }
type TUser = { name: string; };

// 都可以被实现
class MyUser implements IUser { name = "test"; }
class MyUser2 implements TUser { name = "test"; }
```

### 不同点

| 特性 | interface | type |
|------|-----------|------|
| 声明合并 | ✅ 支持 | ❌ 不支持 |
| 继承方式 | `extends` | `&` 交叉 |
| 联合类型 | ❌ 不支持 | ✅ 支持 |
| 原始类型别名 | ❌ 不支持 | ✅ 支持 |

```typescript
// 声明合并（只有 interface 支持）
interface User { name: string; }
interface User { age: number; }
// 合并为：interface User { name: string; age: number; }

// 联合类型（只有 type 支持）
type Result = Success | Error;

// 原始类型别名（只有 type 支持）
type ID = number;
```

### 选择建议

- **优先使用 interface** - 定义对象结构、类实现
- **使用 type** - 联合类型、交叉类型、工具类型

## 函数类型

```typescript
// interface 方式
interface SearchFunc {
  (keyword: string, page: number): Promise<Result[]>;
}

// type 方式
type SearchFunc = (keyword: string, page: number) => Promise<Result[]>;

// 使用
const search: SearchFunc = async (keyword, page) => {
  return [];
};
```

## 实战示例：API 响应类型

```typescript
// 通用响应结构
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 用户数据
interface User {
  id: number;
  name: string;
  email: string;
}

// 分页数据
interface Pagination<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 组合使用
type UserListResponse = ApiResponse<Pagination<User>>;

// 使用
async function fetchUsers(): Promise<UserListResponse> {
  const res = await fetch("/api/users");
  return res.json();
}
```

## 小结

| 概念 | 用途 | 示例 |
|------|------|------|
| `interface` | 定义对象结构 | `interface User { name: string }` |
| `type` | 类型别名 | `type ID = number \| string` |
| `?` | 可选属性 | `age?: number` |
| `readonly` | 只读属性 | `readonly id: number` |
| `extends` | 接口继承 | `interface Dog extends Animal` |
| `&` | 交叉类型 | `type A = B & C` |
| `\|` | 联合类型 | `type Status = "a" \| "b"` |

---

下一章：[函数类型](../04-functions/) →

