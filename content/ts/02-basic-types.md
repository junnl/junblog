+++
date = '2026-01-27T10:02:00+08:00'
draft = false
title = '02. 基础类型系统'
weight = 2
+++

# 基础类型系统

## 类型注解语法

TypeScript 使用 `: 类型` 语法声明类型：

```typescript
let 变量名: 类型 = 值;
```

## 原始类型

### 数字、字符串、布尔

```typescript
// 数字（整数和浮点数都是 number）
let age: number = 25;
let price: number = 99.9;
let hex: number = 0xff;

// 字符串
let name: string = "张三";
let greeting: string = `Hello, ${name}`;

// 布尔
let isDone: boolean = false;
```

### null 和 undefined

```typescript
let n: null = null;
let u: undefined = undefined;

// 默认情况下，null 和 undefined 是所有类型的子类型
// 开启 strictNullChecks 后，必须显式声明
let maybeString: string | null = null;
```

### symbol 和 bigint

```typescript
let sym: symbol = Symbol("key");
let big: bigint = 100n;
```

## 数组

```typescript
// 方式一：类型[]
let numbers: number[] = [1, 2, 3];
let names: string[] = ["Alice", "Bob"];

// 方式二：Array<类型>（泛型写法）
let scores: Array<number> = [90, 85, 92];

// 只读数组
let readonlyArr: readonly number[] = [1, 2, 3];
// readonlyArr.push(4); // ❌ 错误
```

## 元组（Tuple）

固定长度和类型的数组，类似 Python 的元组：

```typescript
// 定义：[类型1, 类型2, ...]
let person: [string, number] = ["张三", 25];

// 访问
console.log(person[0]); // "张三"
console.log(person[1]); // 25

// 解构
const [name, age] = person;

// 可选元素
let point: [number, number, number?] = [10, 20];

// 命名元组（提高可读性）
type Point = [x: number, y: number];
```

## 枚举（Enum）

类似 Java/C# 的枚举：

```typescript
// 数字枚举（默认从 0 开始）
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right  // 3
}

let dir: Direction = Direction.Up;

// 指定值
enum Status {
  Active = 1,
  Inactive = 0,
  Pending = 2
}

// 字符串枚举
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE"
}

// 使用
if (color === Color.Red) { ... }
```

### const 枚举（性能优化）

```typescript
const enum HttpStatus {
  OK = 200,
  NotFound = 404,
  ServerError = 500
}

// 编译后直接内联值，不生成枚举对象
let status = HttpStatus.OK; // 编译为：let status = 200;
```

## any 和 unknown

### any - 放弃类型检查

```typescript
let anything: any = 4;
anything = "string";  // OK
anything = false;     // OK
anything.foo.bar;     // OK（但运行时可能报错！）
```

⚠️ **尽量避免使用 any**，它会让 TypeScript 失去意义。

### unknown - 安全的 any

```typescript
let value: unknown = "hello";

// 不能直接使用，必须先检查类型
// value.toUpperCase(); // ❌ 错误

if (typeof value === "string") {
  value.toUpperCase(); // ✅ OK
}
```

## void 和 never

```typescript
// void - 没有返回值
function log(msg: string): void {
  console.log(msg);
}

// never - 永远不会返回（抛异常或无限循环）
function throwError(msg: string): never {
  throw new Error(msg);
}

function infiniteLoop(): never {
  while (true) {}
}
```

## 类型推断

TypeScript 会自动推断类型，不必处处写类型注解：

```typescript
let x = 10;           // 推断为 number
let arr = [1, 2, 3];  // 推断为 number[]
let obj = { a: 1 };   // 推断为 { a: number }

// 函数返回值也能推断
function add(a: number, b: number) {
  return a + b;  // 返回值推断为 number
}
```

## 类型断言

告诉编译器"我知道这是什么类型"：

```typescript
// 方式一：as 语法（推荐）
let value: unknown = "hello";
let len = (value as string).length;

// 方式二：尖括号语法（JSX 中不能用）
let len2 = (<string>value).length;

// 非空断言（确定不是 null/undefined）
let el = document.getElementById("app")!;
```

## 小结

| 类型 | 说明 | 示例 |
|------|------|------|
| `number` | 数字 | `let n: number = 1` |
| `string` | 字符串 | `let s: string = "hi"` |
| `boolean` | 布尔 | `let b: boolean = true` |
| `array` | 数组 | `let a: number[] = [1,2]` |
| `tuple` | 元组 | `let t: [string, number]` |
| `enum` | 枚举 | `enum Color { Red }` |
| `any` | 任意（避免使用） | `let x: any` |
| `unknown` | 未知（安全） | `let x: unknown` |
| `void` | 无返回值 | `function f(): void` |
| `never` | 永不返回 | `function f(): never` |

---

下一章：[接口与类型别名](../03-interfaces/) →

