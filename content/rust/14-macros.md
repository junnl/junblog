+++
date = '2026-03-05T10:14:00+08:00'
draft = false
title = '14. 宏系统'
weight = 14
+++

# 宏系统

Rust 的宏是**元编程**工具——在编译期生成代码。分为声明宏（`macro_rules!`）和过程宏两大类。

## 声明宏（macro_rules!）

声明宏通过模式匹配生成代码，类似"高级模板"：

```rust
// 最简单的宏
macro_rules! say_hello {
    () => {
        println!("Hello, macro!");
    };
}

fn main() {
    say_hello!(); // 展开为 println!("Hello, macro!");
}
```

### 带参数的宏

```rust
// $x:expr 匹配一个表达式
macro_rules! print_value {
    ($x:expr) => {
        println!("{} = {}", stringify!($x), $x);
    };
}

fn main() {
    let a = 42;
    print_value!(a);       // 输出：a = 42
    print_value!(1 + 2);   // 输出：1 + 2 = 3
}
```

### 多模式匹配

```rust
macro_rules! calculate {
    // 模式 1：加法
    (add $a:expr, $b:expr) => { $a + $b };
    // 模式 2：乘法
    (mul $a:expr, $b:expr) => { $a * $b };
}

fn main() {
    println!("{}", calculate!(add 2, 3)); // 5
    println!("{}", calculate!(mul 4, 5)); // 20
}
```

### 重复匹配

`$(...)*` 匹配零次或多次，`$(...)+` 匹配一次或多次：

```rust
// 实现类似 vec! 的宏
macro_rules! my_vec {
    ( $( $x:expr ),* ) => {
        {
            let mut temp_vec = Vec::new();
            $( temp_vec.push($x); )* // 对每个匹配项重复执行
            temp_vec
        }
    };
}

fn main() {
    let v = my_vec![1, 2, 3, 4, 5];
    println!("{:?}", v); // [1, 2, 3, 4, 5]
}
```

### 常见匹配片段类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `expr` | 表达式 | `1 + 2`、`foo()` |
| `ty` | 类型 | `i32`、`Vec<String>` |
| `ident` | 标识符 | `foo`、`my_var` |
| `pat` | 模式 | `Some(x)`、`_` |
| `stmt` | 语句 | `let x = 5;` |
| `block` | 代码块 | `{ ... }` |
| `item` | 顶级项 | `fn`、`struct` |
| `tt` | 单个 token tree | 任何 token |
| `literal` | 字面量 | `42`、`"hello"` |

### 实用宏示例

```rust
// HashMap 快速构造
macro_rules! hashmap {
    ( $( $key:expr => $value:expr ),* $(,)? ) => {
        {
            let mut map = std::collections::HashMap::new();
            $( map.insert($key, $value); )*
            map
        }
    };
}

fn main() {
    let scores = hashmap! {
        "Alice" => 90,
        "Bob" => 85,
        "Charlie" => 92,
    };
    println!("{:?}", scores);
}
```

## 过程宏（Procedural Macros）

过程宏操作 Rust 的 token 流，比声明宏更强大。分三种：

### 1. Derive 宏

最常用，为结构体/枚举自动实现 trait：

```rust
// 使用（你已经见过很多次了）
#[derive(Debug, Clone, PartialEq)]
struct User {
    name: String,
    age: u32,
}
```

自定义 derive 宏需要创建单独的 crate：

```toml
# my_macro/Cargo.toml
[lib]
proc-macro = true

[dependencies]
quote = "1"
syn = "2"
proc-macro2 = "1"
```

```rust
// my_macro/src/lib.rs
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(HelloMacro)]
pub fn hello_macro_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = input.ident;

    let expanded = quote! {
        impl HelloMacro for #name {
            fn hello() {
                println!("Hello from {}!", stringify!(#name));
            }
        }
    };

    TokenStream::from(expanded)
}
```

### 2. 属性宏

在函数或结构体上添加自定义行为：

```rust
// 使用
#[route(GET, "/")]
fn index() -> &'static str {
    "Hello, World!"
}

// Tokio 的 #[tokio::main] 就是属性宏
#[tokio::main]
async fn main() { }
```

### 3. 函数式宏

看起来像函数调用，但在编译期执行：

```rust
// sqlx 的 query! 宏在编译期检查 SQL 语法
let users = sqlx::query!("SELECT * FROM users WHERE id = $1", user_id)
    .fetch_all(&pool)
    .await?;
```

## 常用标准库宏

| 宏 | 用途 |
|----|------|
| `println!` / `eprintln!` | 格式化输出到 stdout/stderr |
| `format!` | 格式化字符串 |
| `vec!` | 创建 Vec |
| `dbg!` | 调试输出（含文件名和行号） |
| `todo!` | 标记未实现代码（编译通过，运行 panic） |
| `unimplemented!` | 标记未实现（运行 panic） |
| `assert!` / `assert_eq!` | 断言 |
| `cfg!` | 条件编译检查 |
| `include_str!` | 编译期嵌入文件内容 |

```rust
fn main() {
    let x = 42;
    dbg!(x * 2);      // [src/main.rs:3] x * 2 = 84
    todo!("稍后实现"); // 编译通过，运行时 panic
}
```

## 小结

| 类型 | 语法 | 复杂度 | 使用场景 |
|------|------|--------|---------|
| 声明宏 | `macro_rules!` | ⭐⭐ | 简单代码生成、DSL |
| Derive 宏 | `#[derive(X)]` | ⭐⭐⭐ | 自动实现 trait |
| 属性宏 | `#[attr]` | ⭐⭐⭐ | 框架路由、条件编译 |
| 函数式宏 | `name!(...)` | ⭐⭐⭐ | 编译期校验、复杂 DSL |

---

下一章：[CLI 工具开发](../15-cli/) →

