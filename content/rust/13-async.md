+++
date = '2026-03-05T10:13:00+08:00'
draft = false
title = '13. 异步编程'
weight = 13
+++

# 异步编程

Rust 的异步编程基于 `async`/`await` 语法和 `Future` trait，适合 I/O 密集型场景（网络请求、文件读写等）。

**TL;DR：** Rust 的 `async` 是零成本的——编译器将 `async fn` 转换为状态机，没有运行时开销。但需要外部运行时（如 Tokio）来驱动执行。

## async/await 基础

```rust
// async fn 返回一个 Future（不会立即执行）
async fn fetch_data() -> String {
    // 模拟异步操作
    "data from server".to_string()
}

async fn process() {
    let data = fetch_data().await; // .await 等待 Future 完成
    println!("获取到：{}", data);
}
```

> ⚠️ Rust 标准库**不包含**异步运行时。你需要 Tokio、async-std 等第三方运行时。

## Tokio 入门

Tokio 是 Rust 最流行的异步运行时：

```toml
# Cargo.toml
[dependencies]
tokio = { version = "1", features = ["full"] }
```

```rust
use tokio::time::{sleep, Duration};

#[tokio::main] // 宏：创建 Tokio 运行时并运行 main
async fn main() {
    println!("开始");
    sleep(Duration::from_secs(1)).await;
    println!("1 秒后");

    // 并发执行多个任务
    let (a, b) = tokio::join!(
        async_task("A"),
        async_task("B"),
    );
    println!("结果：{}, {}", a, b);
}

async fn async_task(name: &str) -> String {
    sleep(Duration::from_millis(500)).await;
    format!("{}完成", name)
}
```

## spawn — 并发任务

```rust
use tokio::task;

#[tokio::main]
async fn main() {
    let mut handles = vec![];

    for i in 0..5 {
        // spawn 创建异步任务（轻量级，类似 goroutine）
        let handle = task::spawn(async move {
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            format!("任务 {} 完成", i)
        });
        handles.push(handle);
    }

    for handle in handles {
        let result = handle.await.unwrap();
        println!("{}", result);
    }
}
```

## select! — 竞争执行

`select!` 等待多个 Future，返回第一个完成的：

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    tokio::select! {
        _ = sleep(Duration::from_secs(1)) => {
            println!("1 秒超时");
        }
        result = fetch_data() => {
            println!("获取到数据：{}", result);
        }
    }
}

async fn fetch_data() -> String {
    sleep(Duration::from_millis(500)).await;
    "快速响应".to_string()
}
```

## 异步 I/O 实战

```rust
use tokio::fs;
use tokio::io::{self, AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

// 异步文件读写
async fn file_example() -> io::Result<()> {
    fs::write("hello.txt", "Hello, async!").await?;
    let content = fs::read_to_string("hello.txt").await?;
    println!("{}", content);
    Ok(())
}

// 简单 TCP 服务器
async fn tcp_server() -> io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;

    loop {
        let (mut socket, addr) = listener.accept().await?;
        println!("新连接：{}", addr);

        tokio::spawn(async move {
            let mut buf = [0u8; 1024];
            let n = socket.read(&mut buf).await.unwrap();
            socket.write_all(&buf[..n]).await.unwrap(); // echo
        });
    }
}
```

## Stream — 异步迭代器

```rust
use tokio_stream::StreamExt; // 需要 tokio-stream crate

async fn stream_example() {
    let mut stream = tokio_stream::iter(vec![1, 2, 3, 4, 5]);

    while let Some(value) = stream.next().await {
        println!("值：{}", value);
    }
}
```

## 常见陷阱

### 1. 不要在 async 中用阻塞操作

```rust
// ❌ 阻塞操作会卡住整个 Tokio 工作线程
async fn bad() {
    std::thread::sleep(std::time::Duration::from_secs(1)); // 阻塞！
}

// ✅ 用 tokio::time::sleep
async fn good() {
    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
}

// ✅ 必须用阻塞操作时，用 spawn_blocking
async fn blocking_ok() {
    tokio::task::spawn_blocking(|| {
        std::thread::sleep(std::time::Duration::from_secs(1));
    }).await.unwrap();
}
```

### 2. async 闭包中的生命周期

```rust
// spawn 的 Future 必须是 'static（不能借用局部变量）
async fn example() {
    let data = String::from("hello");

    // ❌ data 是借用，不满足 'static
    // tokio::spawn(async { println!("{}", &data); });

    // ✅ move 获取所有权
    tokio::spawn(async move { println!("{}", data); });
}
```

## 同步 vs 异步 选择指南

| 场景 | 推荐 |
|------|------|
| CPU 密集型计算 | `std::thread` 或 `rayon` |
| I/O 密集型（网络、文件） | `async`/`await` + Tokio |
| 少量并发连接 | 线程足够 |
| 高并发（数千连接） | 必须用 async |

## 小结

- `async fn` 返回 Future，需要 `.await` 或运行时来驱动
- Tokio 是最主流的异步运行时
- `tokio::spawn` 创建并发任务，`tokio::join!` 等待多个任务
- `select!` 竞争执行，取最先完成的
- 不要在 async 中使用阻塞操作

---

下一章：[宏系统](../14-macros/) →

