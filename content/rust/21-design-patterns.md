+++
date = '2026-03-05T10:21:00+08:00'
draft = false
title = '21. 设计模式'
weight = 21
+++

# 设计模式（Rust 风格）

传统 OOP 设计模式在 Rust 中需要适配——没有继承、没有 null、所有权系统改变了资源管理方式。本章介绍 Rust 社区常用的惯用模式。

## Builder 模式

构造复杂对象时，用链式调用替代大量构造参数：

```rust
#[derive(Debug)]
struct Server {
    host: String,
    port: u16,
    max_connections: u32,
    timeout_secs: u64,
}

struct ServerBuilder {
    host: String,
    port: u16,
    max_connections: u32,
    timeout_secs: u64,
}

impl ServerBuilder {
    fn new(host: impl Into<String>) -> Self {
        ServerBuilder {
            host: host.into(),
            port: 8080,
            max_connections: 100,
            timeout_secs: 30,
        }
    }

    fn port(mut self, port: u16) -> Self {
        self.port = port;
        self
    }

    fn max_connections(mut self, max: u32) -> Self {
        self.max_connections = max;
        self
    }

    fn timeout(mut self, secs: u64) -> Self {
        self.timeout_secs = secs;
        self
    }

    fn build(self) -> Server {
        Server {
            host: self.host,
            port: self.port,
            max_connections: self.max_connections,
            timeout_secs: self.timeout_secs,
        }
    }
}

fn main() {
    let server = ServerBuilder::new("localhost")
        .port(3000)
        .max_connections(500)
        .timeout(60)
        .build();
    println!("{:?}", server);
}
```

> 💡 很多 Rust 库都用 Builder 模式：`reqwest::Client::builder()`、`tokio::runtime::Builder::new_multi_thread()` 等。

## RAII — 资源获取即初始化

Rust 的所有权 + `Drop` trait 天然支持 RAII，资源在离开作用域时自动释放：

```rust
use std::fs::File;
use std::io::Write;

fn write_log(msg: &str) -> std::io::Result<()> {
    let mut file = File::create("app.log")?;
    writeln!(file, "{}", msg)?;
    Ok(())
    // file 在这里自动关闭（Drop 被调用）
    // 不需要 try-finally 或 defer
}

// 自定义 RAII 守卫
struct MutexGuard<'a, T> {
    data: &'a mut T,
    // Drop 时自动释放锁
}

impl<T> Drop for MutexGuard<'_, T> {
    fn drop(&mut self) {
        println!("锁已释放");
    }
}
```

### 对比其他语言

| 语言 | 资源管理 | Rust 等价 |
|------|---------|-----------|
| Java | try-with-resources | 自动 Drop |
| Go | defer | 自动 Drop |
| C++ | RAII / 析构函数 | Drop trait |
| Python | with 语句 | 作用域 + Drop |

## 状态机模式

用枚举编码所有可能状态，`match` 强制处理每种情况：

```rust
#[derive(Debug)]
enum ConnectionState {
    Disconnected,
    Connecting { attempt: u32 },
    Connected { session_id: String },
    Error { message: String },
}

struct Connection {
    state: ConnectionState,
}

impl Connection {
    fn new() -> Self {
        Connection { state: ConnectionState::Disconnected }
    }

    fn connect(&mut self) {
        self.state = match &self.state {
            ConnectionState::Disconnected => {
                println!("开始连接...");
                ConnectionState::Connecting { attempt: 1 }
            }
            ConnectionState::Connecting { attempt } if *attempt < 3 => {
                println!("重试第 {} 次...", attempt + 1);
                ConnectionState::Connecting { attempt: attempt + 1 }
            }
            ConnectionState::Connecting { attempt } => {
                ConnectionState::Error {
                    message: format!("{}次尝试后失败", attempt),
                }
            }
            ConnectionState::Connected { .. } => {
                println!("已连接");
                return;
            }
            ConnectionState::Error { .. } => {
                println!("重置连接");
                ConnectionState::Connecting { attempt: 1 }
            }
        };
    }

    fn on_success(&mut self, session_id: String) {
        if matches!(self.state, ConnectionState::Connecting { .. }) {
            self.state = ConnectionState::Connected { session_id };
        }
    }
}
```

> 编译期 Typestate 版本见第 19 章。枚举状态机更灵活，Typestate 更严格。

## 策略模式（Trait Object）

用 trait 定义策略接口，运行时选择具体实现：

```rust
trait Compressor {
    fn compress(&self, data: &[u8]) -> Vec<u8>;
    fn name(&self) -> &str;
}

struct Gzip;
struct Zstd;

impl Compressor for Gzip {
    fn compress(&self, data: &[u8]) -> Vec<u8> {
        println!("Gzip 压缩 {} 字节", data.len());
        data.to_vec() // 简化示例
    }
    fn name(&self) -> &str { "gzip" }
}

impl Compressor for Zstd {
    fn compress(&self, data: &[u8]) -> Vec<u8> {
        println!("Zstd 压缩 {} 字节", data.len());
        data.to_vec()
    }
    fn name(&self) -> &str { "zstd" }
}

// 运行时多态
fn process(data: &[u8], compressor: &dyn Compressor) {
    let compressed = compressor.compress(data);
    println!("使用 {} 压缩完成，结果 {} 字节", compressor.name(), compressed.len());
}

fn main() {
    let data = b"hello world";
    let compressor: Box<dyn Compressor> = if true {
        Box::new(Zstd)
    } else {
        Box::new(Gzip)
    };
    process(data, &*compressor);
}
```

## 错误处理最佳实践

```rust
use thiserror::Error;

// 用 thiserror 定义领域错误
#[derive(Error, Debug)]
enum AppError {
    #[error("数据库错误: {0}")]
    Database(#[from] sqlx::Error),

    #[error("配置无效: {field}")]
    InvalidConfig { field: String },

    #[error("未找到: {0}")]
    NotFound(String),
}

// 库代码：用具体错误类型（thiserror）
// 应用代码：用 anyhow::Result 简化传播
fn app_main() -> anyhow::Result<()> {
    let config = load_config().context("加载配置失败")?;
    let db = connect_db(&config).context("连接数据库失败")?;
    Ok(())
}
```

## Rust 惯用模式速查

| 模式 | 用途 | 关键特性 |
|------|------|---------|
| Builder | 复杂对象构造 | 链式调用 + `build()` |
| RAII | 资源自动管理 | Drop trait |
| 状态机 | 状态转换 | enum + match |
| 策略 | 运行时多态 | `dyn Trait` |
| Newtype | 类型安全 | 元组结构体包装 |
| Typestate | 编译期状态约束 | PhantomData + 泛型 |
| From/Into | 类型转换 | `impl From<T>` |
| Deref | 智能指针行为 | `impl Deref` |

## 小结

- Builder 模式用链式调用构造复杂对象，Rust 生态广泛使用
- RAII 是 Rust 的天然优势——所有权 + Drop 自动管理资源
- 枚举状态机让 `match` 强制处理所有状态
- 策略模式用 `dyn Trait` 实现运行时多态
- 错误处理：库用 `thiserror`，应用用 `anyhow`

---

🎉 **恭喜完成 Rust 全部 21 章学习！**

回到 [课程目录](../) 复习，或开始你的 Rust 实战项目吧。

