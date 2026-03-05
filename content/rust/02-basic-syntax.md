+++
date = '2026-03-05T10:02:00+08:00'
draft = false
title = '02. 基本语法'
weight = 2
+++

# 基本语法

## 变量与可变性

Rust 的变量**默认不可变**（immutable），这是与大多数语言最大的不同：

```rust
fn main() {
    let x = 5;
    // x = 6; // ❌ 编译错误：cannot assign twice to immutable variable

    let mut y = 5; // mut 关键字声明可变变量
    y = 6;         // ✅ OK
    println!("x = {}, y = {}", x, y);
}
```

### 变量遮蔽（Shadowing）

可以用 `let` 重新声明同名变量，甚至可以改变类型：

```rust
fn main() {
    let x = 5;
    let x = x + 1;       // 遮蔽前一个 x
    let x = x * 2;       // 再次遮蔽
    println!("x = {}", x); // 输出：x = 12

    let spaces = "   ";       // &str 类型
    let spaces = spaces.len(); // 遮蔽为 usize 类型，完全合法
    println!("spaces = {}", spaces); // 输出：spaces = 3
}
```

> 💡 Shadowing 和 `mut` 的区别：Shadowing 创建了一个**全新变量**，可以改变类型；`mut` 只允许改变值，类型不变。

### 常量

```rust
const MAX_POINTS: u32 = 100_000; // 常量必须标注类型，用大写蛇形命名
```

## 基本数据类型

### 标量类型

| 类型 | Rust | 示例 | 类比 |
|------|------|------|------|
| 整数 | `i8` `i16` `i32` `i64` `i128` `isize` | `let x: i32 = 42;` | Java `int` / C `int` |
| 无符号整数 | `u8` `u16` `u32` `u64` `u128` `usize` | `let x: u32 = 42;` | C `unsigned int` |
| 浮点 | `f32` `f64` | `let pi: f64 = 3.14;` | Java `double` |
| 布尔 | `bool` | `let t = true;` | 通用 |
| 字符 | `char` | `let c = '中';` | Unicode 标量值（4 字节） |

```rust
fn main() {
    let guess: i32 = 42;
    let pi = 3.14;              // 默认 f64
    let is_active = true;
    let letter = 'A';
    let emoji = '🦀';           // char 支持 Unicode

    // 数字字面量技巧
    let million = 1_000_000;    // 下划线分隔，提高可读性
    let hex = 0xff;             // 十六进制
    let binary = 0b1010;        // 二进制
    let byte = b'A';            // 字节（u8）
}
```

### 复合类型

```rust
fn main() {
    // 元组（Tuple）- 固定长度，可含不同类型
    let tup: (i32, f64, bool) = (500, 6.4, true);
    let (x, y, z) = tup;        // 解构
    let first = tup.0;          // 索引访问

    // 数组（Array）- 固定长度，相同类型
    let arr = [1, 2, 3, 4, 5];
    let first = arr[0];
    let arr2 = [0; 5];          // [0, 0, 0, 0, 0]
}
```

## 函数

```rust
// 函数签名：参数必须标注类型
fn add(a: i32, b: i32) -> i32 {
    a + b  // 最后一行无分号 = 返回值（表达式）
}

// 无返回值（返回 unit 类型 ()）
fn greet(name: &str) {
    println!("Hello, {}!", name);
}

fn main() {
    let sum = add(3, 5);
    println!("3 + 5 = {}", sum); // 输出：3 + 5 = 8
    greet("Rust");               // 输出：Hello, Rust!
}
```

### 表达式 vs 语句

Rust 是**表达式导向**的语言，这与 C/Java 不同：

```rust
fn main() {
    // 语句（Statement）：执行操作，不返回值
    let x = 5; // let 绑定是语句

    // 表达式（Expression）：求值并返回结果
    let y = {
        let x = 3;
        x + 1  // 注意：无分号 → 这是表达式，值为 4
    };
    println!("y = {}", y); // 输出：y = 4

    // if 也是表达式
    let condition = true;
    let number = if condition { 5 } else { 6 };
    println!("number = {}", number); // 输出：number = 5
}
```

## 控制流

### if 表达式

```rust
fn main() {
    let number = 7;

    if number < 5 {
        println!("小于 5");
    } else if number < 10 {
        println!("小于 10");  // ← 执行这行
    } else {
        println!("大于等于 10");
    }

    // 条件必须是 bool，不会隐式转换
    // if number { } // ❌ 编译错误：expected `bool`, found integer
}
```

### 循环

```rust
fn main() {
    // loop - 无限循环，可返回值
    let mut counter = 0;
    let result = loop {
        counter += 1;
        if counter == 10 {
            break counter * 2; // break 可以带返回值
        }
    };
    println!("result = {}", result); // 输出：result = 20

    // while 循环
    let mut n = 3;
    while n > 0 {
        println!("{}!", n);
        n -= 1;
    }

    // for 循环（最常用）
    let arr = [10, 20, 30, 40, 50];
    for element in arr {
        println!("值：{}", element);
    }

    // 范围循环
    for i in 0..5 {
        println!("i = {}", i); // 0, 1, 2, 3, 4
    }

    // 包含末尾
    for i in 1..=3 {
        println!("i = {}", i); // 1, 2, 3
    }
}
```

## 与其他语言对比

| 概念 | Rust | Go | TypeScript |
|------|------|-----|-----------|
| 变量声明 | `let x = 5;` | `x := 5` | `const x = 5` |
| 可变变量 | `let mut x = 5;` | `x := 5`（默认可变） | `let x = 5` |
| 类型标注 | `let x: i32 = 5;` | `var x int = 5` | `let x: number = 5` |
| 函数返回 | 最后表达式（无分号） | `return` | `return` |
| for 循环 | `for x in iter` | `for _, x := range iter` | `for (const x of iter)` |

## 小结

- 变量默认不可变，用 `mut` 声明可变
- Shadowing 允许重新绑定同名变量（可改变类型）
- Rust 是表达式导向：`if`、`loop`、`{}` 块都能返回值
- 函数最后一个表达式（无分号）就是返回值
- `for in` 是最常用的循环方式

---

下一章：[所有权系统](../03-ownership/) →

