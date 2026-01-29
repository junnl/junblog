+++
date = '2026-01-27T10:04:00+08:00'
draft = false
title = '04. 函数类型'
weight = 4
+++

# 函数类型

## 基本函数类型

```typescript
// 参数和返回值类型
function add(a: number, b: number): number {
  return a + b;
}

// 箭头函数
const multiply = (a: number, b: number): number => a * b;

// 返回值类型推断（可省略）
const divide = (a: number, b: number) => a / b; // 推断为 number
```

## 可选参数和默认值

```typescript
// 可选参数（必须放在必选参数后面）
function greet(name: string, greeting?: string): string {
  return `${greeting || "Hello"}, ${name}!`;
}

greet("张三");           // "Hello, 张三!"
greet("张三", "你好");   // "你好, 张三!"

// 默认参数
function createUser(name: string, role: string = "user"): User {
  return { name, role };
}

createUser("张三");          // { name: "张三", role: "user" }
createUser("李四", "admin"); // { name: "李四", role: "admin" }
```

## 剩余参数

```typescript
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}

sum(1, 2, 3);       // 6
sum(1, 2, 3, 4, 5); // 15

// 结合其他参数
function log(level: string, ...messages: string[]): void {
  console.log(`[${level}]`, ...messages);
}
```

## 函数类型表达式

```typescript
// 定义函数类型
type MathFunc = (a: number, b: number) => number;

const add: MathFunc = (a, b) => a + b;
const sub: MathFunc = (a, b) => a - b;

// 作为参数
function calculate(a: number, b: number, fn: MathFunc): number {
  return fn(a, b);
}

calculate(10, 5, add); // 15
calculate(10, 5, sub); // 5
```

## 调用签名

当函数还有属性时：

```typescript
interface CallableWithProps {
  (x: number): number;
  description: string;
}

const double: CallableWithProps = (x) => x * 2;
double.description = "将数字翻倍";

console.log(double(5));           // 10
console.log(double.description);  // "将数字翻倍"
```

## 函数重载

TypeScript 支持函数重载，类似 Java/C#：

```typescript
// 重载签名
function format(value: string): string;
function format(value: number): string;
function format(value: Date): string;

// 实现签名
function format(value: string | number | Date): string {
  if (typeof value === "string") {
    return value.trim();
  } else if (typeof value === "number") {
    return value.toFixed(2);
  } else {
    return value.toISOString();
  }
}

format("  hello  "); // "hello"
format(3.14159);     // "3.14"
format(new Date());  // "2026-01-27T..."
```

### 重载的实际应用

```typescript
// DOM 查询重载
function querySelector(selector: "input"): HTMLInputElement | null;
function querySelector(selector: "button"): HTMLButtonElement | null;
function querySelector(selector: string): HTMLElement | null;
function querySelector(selector: string): HTMLElement | null {
  return document.querySelector(selector);
}

const input = querySelector("input");  // 类型是 HTMLInputElement | null
const btn = querySelector("button");   // 类型是 HTMLButtonElement | null
```

## this 类型

```typescript
interface User {
  name: string;
  greet(this: User): void;
}

const user: User = {
  name: "张三",
  greet() {
    console.log(`Hello, ${this.name}`);
  }
};

user.greet(); // "Hello, 张三"

// 错误用法会被检测到
const greet = user.greet;
// greet(); // ❌ 错误：this 上下文不对
```

## 泛型函数（预览）

```typescript
// 泛型函数 - 保持类型关系
function identity<T>(value: T): T {
  return value;
}

identity(42);      // 返回类型是 number
identity("hello"); // 返回类型是 string

// 数组第一个元素
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

first([1, 2, 3]);     // number | undefined
first(["a", "b"]);    // string | undefined
```

## 实战：回调函数类型

```typescript
// 事件处理器
type EventHandler<E> = (event: E) => void;

// 异步回调
type AsyncCallback<T> = (error: Error | null, data: T | null) => void;

// Promise 风格
type AsyncFn<T> = () => Promise<T>;

// 使用示例
function fetchData(callback: AsyncCallback<User[]>): void {
  // ...
  callback(null, users);
}

// 或者 Promise 风格
async function fetchDataAsync(): Promise<User[]> {
  const res = await fetch("/api/users");
  return res.json();
}
```

## 小结

| 概念 | 语法 | 示例 |
|------|------|------|
| 参数类型 | `param: Type` | `(a: number)` |
| 返回类型 | `(): Type` | `(): string` |
| 可选参数 | `param?` | `(name?: string)` |
| 默认值 | `param = value` | `(role = "user")` |
| 剩余参数 | `...args: T[]` | `(...nums: number[])` |
| 函数类型 | `type F = () => T` | `type Fn = (x: number) => number` |
| 重载 | 多个签名 | 见上方示例 |

---

下一章：[泛型](../05-generics/) →

