+++
date = '2026-01-27T10:11:00+08:00'
draft = false
title = '11. 异步编程'
weight = 11
+++

# 异步编程

作为后端开发者，你一定熟悉异步编程。本章讲解 TypeScript 中如何为异步代码添加类型。

## Promise 类型

### 基本用法

```typescript
// Promise<T> - T 是 resolve 的值类型
const promise: Promise<string> = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("Hello");
  }, 1000);
});

// 使用
promise.then((value) => {
  console.log(value); // value 是 string 类型
});
```

### 创建 Promise 函数

```typescript
// 返回 Promise 的函数
function fetchUser(id: number): Promise<User> {
  return fetch(`/api/users/${id}`)
    .then(res => res.json());
}

// 使用泛型让返回类型更灵活
async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return response.json();
}

// 调用时指定类型
const user = await fetchData<User>("/api/user/1");
const posts = await fetchData<Post[]>("/api/posts");
```

## async/await 类型

### 基本语法

```typescript
// async 函数自动返回 Promise
async function getUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const user: User = await response.json();
  return user; // 自动包装为 Promise<User>
}

// 返回类型可以省略，TS 会推断
async function getUser(id: number) {
  const response = await fetch(`/api/users/${id}`);
  return response.json() as Promise<User>;
}
```

### 并行执行

```typescript
// Promise.all - 所有成功才成功
async function fetchAllUsers(ids: number[]): Promise<User[]> {
  const promises = ids.map(id => fetchUser(id));
  return Promise.all(promises);
}

// Promise.allSettled - 获取所有结果（无论成功失败）
type SettledResult<T> = PromiseSettledResult<T>;

async function fetchUsersSettled(ids: number[]): Promise<SettledResult<User>[]> {
  const promises = ids.map(id => fetchUser(id));
  return Promise.allSettled(promises);
}

// Promise.race - 第一个完成的
async function fetchWithTimeout<T>(
  promise: Promise<T>,
  timeout: number
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Timeout")), timeout);
  });
  return Promise.race([promise, timeoutPromise]);
}
```

## 异步函数类型定义

```typescript
// 定义异步函数类型
type AsyncFunction<T> = () => Promise<T>;
type AsyncFunctionWithArg<A, T> = (arg: A) => Promise<T>;

// 使用
const fetchUser: AsyncFunctionWithArg<number, User> = async (id) => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
};

// 更通用的定义
type AsyncFn<Args extends any[], Return> = (...args: Args) => Promise<Return>;

const search: AsyncFn<[string, number], User[]> = async (keyword, page) => {
  // ...
  return [];
};
```

## 回调函数类型

```typescript
// Node.js 风格回调
type NodeCallback<T> = (error: Error | null, data: T | null) => void;

function readFile(path: string, callback: NodeCallback<string>): void {
  // ...
  callback(null, "file content");
}

// 将回调转为 Promise
function promisify<T>(
  fn: (callback: NodeCallback<T>) => void
): () => Promise<T> {
  return () => new Promise((resolve, reject) => {
    fn((error, data) => {
      if (error) reject(error);
      else resolve(data!);
    });
  });
}
```

## 异步迭代器

```typescript
// 异步生成器
async function* fetchPages(url: string): AsyncGenerator<Page[], void, unknown> {
  let page = 1;
  while (true) {
    const response = await fetch(`${url}?page=${page}`);
    const data: Page[] = await response.json();
    if (data.length === 0) break;
    yield data;
    page++;
  }
}

// 使用 for await...of
async function processAllPages() {
  for await (const pages of fetchPages("/api/pages")) {
    console.log(`Got ${pages.length} pages`);
  }
}

// AsyncIterable 类型
interface DataStream {
  [Symbol.asyncIterator](): AsyncIterator<Data>;
}
```

## 实战：类型安全的 API 客户端

```typescript
// API 响应类型
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 请求配置
interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

// 类型安全的请求函数
async function request<T>(
  url: string,
  config: RequestConfig = {}
): Promise<T> {
  const { method = "GET", body, headers } = config;
  
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  return result.data;
}

// 使用
interface User { id: number; name: string; }

const user = await request<User>("/api/user/1");
const users = await request<User[]>("/api/users");
```

## 小结

| 概念 | 类型 | 示例 |
|------|------|------|
| Promise | `Promise<T>` | `Promise<string>` |
| async 函数 | `() => Promise<T>` | `async function(): Promise<User>` |
| Promise.all | `Promise<T[]>` | `Promise.all<User>(promises)` |
| 异步生成器 | `AsyncGenerator<T>` | `async function*` |
| 异步迭代 | `for await...of` | 遍历异步数据流 |

---

下一章：[错误处理](../12-error-handling/) →

