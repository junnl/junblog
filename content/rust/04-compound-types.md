+++
date = '2026-03-05T10:04:00+08:00'
draft = false
title = '04. 复合类型'
weight = 4
+++

# 复合类型

## 结构体（Struct）

结构体是 Rust 中组织数据的主要方式，类似其他语言的 class 或 struct。

### 经典结构体

```rust
struct User {
    username: String,
    email: String,
    active: bool,
    sign_in_count: u64,
}

fn main() {
    // 创建实例（所有字段必须赋值）
    let user = User {
        username: String::from("alice"),
        email: String::from("alice@example.com"),
        active: true,
        sign_in_count: 1,
    };

    println!("用户名：{}", user.username);

    // 可变实例（整个结构体要么可变，要么不可变）
    let mut user2 = User {
        username: String::from("bob"),
        ..user // 结构体更新语法：其余字段从 user 移动/复制
    };
    user2.email = String::from("bob@example.com");
}
```

### 为结构体实现方法

```rust
struct Rectangle {
    width: f64,
    height: f64,
}

impl Rectangle {
    // 方法：第一个参数是 &self
    fn area(&self) -> f64 {
        self.width * self.height
    }

    fn is_square(&self) -> bool {
        (self.width - self.height).abs() < f64::EPSILON
    }

    // 关联函数（类似静态方法）：没有 self 参数
    fn square(size: f64) -> Rectangle {
        Rectangle { width: size, height: size }
    }
}

fn main() {
    let rect = Rectangle { width: 10.0, height: 5.0 };
    println!("面积：{}", rect.area());       // 输出：面积：50
    println!("正方形？{}", rect.is_square()); // 输出：正方形？false

    let sq = Rectangle::square(5.0);  // 调用关联函数
    println!("正方形面积：{}", sq.area());    // 输出：正方形面积：25
}
```

### 元组结构体与单元结构体

```rust
// 元组结构体 - 有名字但字段没名字
struct Color(u8, u8, u8);
struct Point(f64, f64, f64);

// 单元结构体 - 没有任何字段（常用于 trait 实现）
struct AlwaysEqual;

fn main() {
    let red = Color(255, 0, 0);
    println!("R = {}", red.0);
}
```

## 枚举（Enum）

Rust 枚举远比 C/Java 的枚举强大——每个变体可以携带不同类型的数据：

```rust
enum IpAddr {
    V4(u8, u8, u8, u8),
    V6(String),
}

enum Message {
    Quit,                       // 无数据
    Move { x: i32, y: i32 },   // 命名字段（类似结构体）
    Write(String),              // 包含一个 String
    ChangeColor(i32, i32, i32), // 包含三个 i32
}

impl Message {
    fn call(&self) {
        // 方法实现
    }
}

fn main() {
    let home = IpAddr::V4(127, 0, 0, 1);
    let loopback = IpAddr::V6(String::from("::1"));
    let msg = Message::Write(String::from("hello"));
    msg.call();
}
```

## 模式匹配（match）

`match` 是 Rust 最强大的控制流结构，必须**穷尽**所有可能：

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u32 {
    match coin {
        Coin::Penny => {
            println!("Lucky penny!");
            1
        }
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}

// 匹配枚举中的数据
fn describe_ip(ip: IpAddr) {
    match ip {
        IpAddr::V4(a, b, c, d) => println!("IPv4: {}.{}.{}.{}", a, b, c, d),
        IpAddr::V6(addr) => println!("IPv6: {}", addr),
    }
}

// 通配模式
fn describe_number(n: i32) {
    match n {
        1 => println!("one"),
        2 => println!("two"),
        3..=9 => println!("three to nine"),
        _ => println!("other"), // _ 匹配所有剩余情况
    }
}
```

## Option\<T\> — 告别 null

Rust **没有 null**。取而代之的是标准库的 `Option<T>` 枚举：

```rust
enum Option<T> {
    Some(T),  // 有值
    None,     // 无值
}
```

```rust
fn find_first_a(s: &str) -> Option<usize> {
    s.find('a')
}

fn main() {
    let result = find_first_a("banana");

    // match 处理 Option
    match result {
        Some(index) => println!("找到 'a' 在位置 {}", index),
        None => println!("没找到"),
    }

    // if let 简写（只关心一种情况时）
    if let Some(index) = find_first_a("hello") {
        println!("位置：{}", index);
    } else {
        println!("没有 'a'");
    }

    // 常用方法
    let x: Option<i32> = Some(42);
    let y: Option<i32> = None;

    println!("{}", x.unwrap());          // 42（None 时 panic）
    println!("{}", y.unwrap_or(0));      // 0（None 时用默认值）
    println!("{}", x.map(|v| v * 2).unwrap()); // 84
}
```

## if let 与 while let

当你只关心一种匹配模式时，`if let` 比 `match` 更简洁：

```rust
fn main() {
    let config_max: Option<u8> = Some(3);

    // 等价于 match config_max { Some(max) => ..., _ => () }
    if let Some(max) = config_max {
        println!("最大值：{}", max);
    }

    // while let — 循环匹配
    let mut stack = vec![1, 2, 3];
    while let Some(top) = stack.pop() {
        println!("弹出：{}", top); // 3, 2, 1
    }
}
```

## 小结

| 概念 | 说明 |
|------|------|
| **结构体** | 用 `struct` 组织数据，用 `impl` 添加方法 |
| **枚举** | 变体可携带不同类型数据，比传统枚举强大得多 |
| **match** | 模式匹配，必须穷尽所有可能 |
| **Option\<T\>** | 替代 null，强制处理"无值"的情况 |
| **if let** | match 的简写，只关心一种匹配模式时使用 |

---

下一章：[模块与包管理](../05-modules/) →

