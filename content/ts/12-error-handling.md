+++
date = '2026-01-27T10:12:00+08:00'
draft = false
title = '12. 错误处理'
weight = 12
+++

# 错误处理

TypeScript 中的错误处理需要特别注意类型安全，本章介绍最佳实践。

## Error 类型基础

### 内置 Error 类型

```typescript
// 基本用法
try {
  throw new Error("Something went wrong");
} catch (error) {
  // error 默认是 unknown 类型（TS 4.4+）
  if (error instanceof Error) {
    console.log(error.message); // 类型安全
    console.log(error.stack);
  }
}

// Error 接口
interface Error {
  name: string;
  message: string;
  stack?: string;
}
```

### catch 中的类型问题

```typescript
// ❌ 错误：catch 的 error 是 unknown
try {
  // ...
} catch (error) {
  console.log(error.message); // 错误：unknown 类型
}

// ✅ 正确：类型检查后使用
try {
  // ...
} catch (error) {
  if (error instanceof Error) {
    console.log(error.message);
  } else {
    console.log(String(error));
  }
}

// ✅ 或者使用类型断言（确定是 Error 时）
try {
  // ...
} catch (error) {
  const err = error as Error;
  console.log(err.message);
}
```

## 自定义错误类

```typescript
// 基础自定义错误
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
    // 修复原型链（ES5 兼容）
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// 具体错误类型
class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

class ValidationError extends AppError {
  constructor(
    message: string,
    public fields: Record<string, string>
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

// 使用
function getUser(id: number): User {
  const user = db.find(id);
  if (!user) {
    throw new NotFoundError(`User ${id}`);
  }
  return user;
}
```

## 类型安全的错误处理

```typescript
// 错误类型守卫
function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

// 统一错误处理
function handleError(error: unknown): void {
  if (isValidationError(error)) {
    console.log("验证错误:", error.fields);
  } else if (isAppError(error)) {
    console.log(`[${error.code}] ${error.message}`);
  } else if (error instanceof Error) {
    console.log("未知错误:", error.message);
  } else {
    console.log("未知错误:", String(error));
  }
}
```

## Result 模式（推荐）

不使用 throw，而是返回结果类型：

```typescript
// 定义 Result 类型
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// 创建辅助函数
function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

// 使用 Result 模式
async function fetchUser(id: number): Promise<Result<User, AppError>> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      return err(new NotFoundError(`User ${id}`));
    }
    const user = await response.json();
    return ok(user);
  } catch (e) {
    return err(new AppError("Network error", "NETWORK_ERROR"));
  }
}

// 调用方处理
const result = await fetchUser(1);
if (result.success) {
  console.log(result.data.name); // 类型安全
} else {
  console.log(result.error.message); // 类型安全
}
```

### Result 工具函数

```typescript
// 链式处理
function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (result.success) {
    return ok(fn(result.data));
  }
  return result;
}

// 解包或抛出
function unwrap<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

// 解包或返回默认值
function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.success) {
    return result.data;
  }
  return defaultValue;
}
```

## 异步错误处理

```typescript
// 包装异步函数，统一错误处理
async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<Result<T, Error>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

// 使用
const result = await tryCatch(() => fetchUser(1));
```

## 实战：Express 错误处理

```typescript
// 错误处理中间件类型
import { Request, Response, NextFunction } from "express";

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// 包装异步路由处理器
function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// 全局错误处理中间件
function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (isAppError(error)) {
    res.status(error.statusCode).json({
      code: error.code,
      message: error.message,
    });
  } else {
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    });
  }
}
```

## 小结

| 模式 | 优点 | 缺点 |
|------|------|------|
| try/catch | 熟悉、简单 | 类型不安全 |
| 自定义 Error | 可分类处理 | 仍需 try/catch |
| Result 模式 | 类型安全、显式 | 代码稍多 |

**推荐**：对于关键业务逻辑，使用 Result 模式；对于边界层（如 API 路由），使用 try/catch + 自定义 Error。

---

下一章：[类型守卫进阶](../13-type-guards/) →

