+++
date = '2026-03-05T10:07:00+08:00'
draft = false
title = '07. 错误处理'
weight = 7
+++

# 错误处理

Rust 没有异常（exception）。错误分为两类：不可恢复的用 `panic!`，可恢复的用 `Result<T, E>`。

## panic! — 不可恢复错误

程序遇到无法继续的情况时，调用 `panic!` 终止：

```rust
fn main() {
    // 主动触发
    // panic!("crash and burn");

    // 数组越界也会触发 panic
    let v = vec![1, 2, 3];
    // v[99]; // thread 'main' panicked at 'index out of bounds'
}
```

> 💡 `panic!` 用于程序 bug（如逻辑错误、不变量被破坏），**不要**用于预期中的错误。

## Result\<T, E\> — 可恢复错误

```rust
enum Result<T, E> {
    Ok(T),   // 成功，携带结果值
    Err(E),  // 失败，携带错误信息
}
```

大量标准库函数返回 `Result`：

```rust
use std::fs;

fn main() {
    // 文件读取返回 Result<String, io::Error>
    let content = fs::read_to_string("hello.txt");

    match content {
        Ok(text) => println!("文件内容：{}", text),
        Err(err) => println!("读取失败：{}", err),
    }
}
```

### 处理 Result 的多种方式

```rust
use std::fs;

fn main() {
    // 1. match - 最完整
    let result = fs::read_to_string("config.toml");
    let content = match result {
        Ok(c) => c,
        Err(e) => {
            eprintln!("错误：{}", e);
            String::from("默认配置")
        }
    };

    // 2. unwrap - 成功返回值，失败 panic（原型开发用）
    let content = fs::read_to_string("config.toml").unwrap();

    // 3. expect - 同 unwrap，但可自定义 panic 信息
    let content = fs::read_to_string("config.toml")
        .expect("无法读取 config.toml");

    // 4. unwrap_or - 失败时返回默认值
    let content = fs::read_to_string("config.toml")
        .unwrap_or(String::from("默认配置"));

    // 5. unwrap_or_else - 失败时执行闭包
    let content = fs::read_to_string("config.toml")
        .unwrap_or_else(|e| {
            eprintln!("警告：{}，使用默认配置", e);
            String::from("默认配置")
        });
}
```

## ? 操作符 — 错误传播

`?` 是 Rust 最优雅的错误传播方式：遇到 `Err` 就提前返回，遇到 `Ok` 就解包继续：

```rust
use std::fs;
use std::io;

// 不用 ? 的写法
fn read_username_verbose() -> Result<String, io::Error> {
    let result = fs::read_to_string("username.txt");
    match result {
        Ok(content) => Ok(content.trim().to_string()),
        Err(e) => Err(e),
    }
}

// 用 ? 的写法 — 简洁得多
fn read_username() -> Result<String, io::Error> {
    let content = fs::read_to_string("username.txt")?; // 失败时自动返回 Err
    Ok(content.trim().to_string())
}

// ? 可以链式调用
fn read_and_parse() -> Result<i32, Box<dyn std::error::Error>> {
    let content = fs::read_to_string("number.txt")?;
    let number = content.trim().parse::<i32>()?;
    Ok(number)
}
```

> `?` 只能在返回 `Result` 或 `Option` 的函数中使用。

## 自定义错误类型

```rust
use std::fmt;

#[derive(Debug)]
enum AppError {
    NotFound(String),
    PermissionDenied,
    ParseError(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::NotFound(name) => write!(f, "未找到：{}", name),
            AppError::PermissionDenied => write!(f, "权限不足"),
            AppError::ParseError(msg) => write!(f, "解析错误：{}", msg),
        }
    }
}

impl std::error::Error for AppError {}

fn find_user(id: u32) -> Result<String, AppError> {
    if id == 0 {
        return Err(AppError::NotFound("用户 0 不存在".into()));
    }
    Ok(format!("User_{}", id))
}
```

## 实战推荐：thiserror 与 anyhow

手写 `Display` 和 `Error` 太啰嗦，生产项目推荐用这两个库：

```rust
// thiserror — 用于库代码，自动派生 Error trait
use thiserror::Error;

#[derive(Error, Debug)]
enum ApiError {
    #[error("数据库错误：{0}")]
    Database(#[from] sqlx::Error),

    #[error("未找到资源：{resource}")]
    NotFound { resource: String },

    #[error("验证失败：{0}")]
    Validation(String),
}

// anyhow — 用于应用代码，简化错误传播
use anyhow::{Context, Result};

fn load_config() -> Result<Config> {
    let content = std::fs::read_to_string("config.toml")
        .context("无法读取配置文件")?;
    let config: Config = toml::from_str(&content)
        .context("配置文件格式错误")?;
    Ok(config)
}
```

| 库 | 适用场景 | 特点 |
|----|---------|------|
| `thiserror` | 库开发 | 自动实现 Error trait，类型安全 |
| `anyhow` | 应用开发 | `anyhow::Result` 统一错误类型，`.context()` 添加上下文 |

## 错误处理选择指南

| 场景 | 推荐 |
|------|------|
| 原型/脚本 | `unwrap()` / `expect()` |
| 应用代码 | `anyhow::Result` + `?` |
| 库代码 | 自定义错误 + `thiserror` |
| 不可恢复 bug | `panic!` |

## 小结

- `panic!` 用于不可恢复错误（程序 bug）
- `Result<T, E>` 用于可恢复错误，强制调用者处理
- `?` 操作符简洁地传播错误
- 库用 `thiserror`，应用用 `anyhow`

---

下一章：[泛型与 Trait](../08-generics-traits/) →

