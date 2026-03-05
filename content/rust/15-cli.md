+++
date = '2026-03-05T10:15:00+08:00'
draft = false
title = '15. CLI 工具开发'
weight = 15
+++

# CLI 工具开发

Rust 编译为原生二进制、启动快、无运行时依赖，天然适合构建 CLI 工具。本章用实战项目串联前面的知识。

## 项目初始化

```bash
cargo new json-tool
cd json-tool
cargo add clap --features derive
cargo add serde --features derive
cargo add serde_json
cargo add anyhow
```

## clap — 参数解析

`clap` 是 Rust 最流行的命令行参数解析库：

```rust
use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "json-tool", about = "一个 JSON 处理工具")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// 格式化 JSON 文件
    Format {
        /// 输入文件路径
        #[arg(short, long)]
        input: String,

        /// 输出文件路径（默认输出到 stdout）
        #[arg(short, long)]
        output: Option<String>,

        /// 缩进空格数
        #[arg(long, default_value = "2")]
        indent: usize,
    },
    /// 查询 JSON 中的字段
    Query {
        /// 输入文件路径
        #[arg(short, long)]
        input: String,

        /// JSON 路径（如 "users.0.name"）
        path: String,
    },
    /// 验证 JSON 是否合法
    Validate {
        /// 输入文件路径
        input: String,
    },
}
```

使用效果：

```bash
json-tool format --input data.json --indent 4
json-tool query --input data.json "users.0.name"
json-tool validate data.json
json-tool --help
```

## serde — 序列化与反序列化

`serde` + `serde_json` 是 Rust 序列化的标配：

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct User {
    name: String,
    age: u32,
    #[serde(default)]            // 缺失时用默认值
    active: bool,
    #[serde(rename = "emailAddr")] // JSON 字段名映射
    email: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    phone: Option<String>,
}

fn main() -> anyhow::Result<()> {
    // JSON → 结构体
    let json = r#"{"name":"Alice","age":30,"emailAddr":"a@b.com"}"#;
    let user: User = serde_json::from_str(json)?;
    println!("{:?}", user);

    // 结构体 → JSON
    let json_output = serde_json::to_string_pretty(&user)?;
    println!("{}", json_output);

    // 动态 JSON（不需要预定义结构体）
    let value: serde_json::Value = serde_json::from_str(json)?;
    println!("name = {}", value["name"]);

    Ok(())
}
```

## 文件 I/O

```rust
use std::fs;
use std::io::{self, Read, Write, BufRead, BufReader};
use anyhow::{Context, Result};

// 读取整个文件
fn read_file(path: &str) -> Result<String> {
    fs::read_to_string(path)
        .with_context(|| format!("无法读取文件：{}", path))
}

// 写入文件
fn write_file(path: &str, content: &str) -> Result<()> {
    fs::write(path, content)
        .with_context(|| format!("无法写入文件：{}", path))
}

// 逐行读取（大文件友好）
fn read_lines(path: &str) -> Result<()> {
    let file = fs::File::open(path)?;
    let reader = BufReader::new(file);

    for (i, line) in reader.lines().enumerate() {
        let line = line?;
        println!("{:>4}: {}", i + 1, line);
    }
    Ok(())
}

// 从 stdin 读取
fn read_stdin() -> Result<String> {
    let mut buffer = String::new();
    io::stdin().read_to_string(&mut buffer)?;
    Ok(buffer)
}
```

## 组装完整项目

```rust
use anyhow::{Context, Result};
use clap::Parser;

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Format { input, output, indent } => {
            let content = std::fs::read_to_string(&input)
                .with_context(|| format!("无法读取 {}", input))?;

            let value: serde_json::Value = serde_json::from_str(&content)
                .context("JSON 格式无效")?;

            let formatter = serde_json::ser::PrettyFormatter::with_indent(
                &" ".repeat(indent).into_bytes()
            );
            let mut buf = Vec::new();
            let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
            serde::Serialize::serialize(&value, &mut ser)?;
            let formatted = String::from_utf8(buf)?;

            match output {
                Some(path) => std::fs::write(&path, &formatted)
                    .with_context(|| format!("无法写入 {}", path))?,
                None => println!("{}", formatted),
            }
        }
        Commands::Validate { input } => {
            let content = std::fs::read_to_string(&input)?;
            match serde_json::from_str::<serde_json::Value>(&content) {
                Ok(_) => println!("✅ {} 是合法的 JSON", input),
                Err(e) => println!("❌ {} 不合法：{}", input, e),
            }
        }
        Commands::Query { input, path } => {
            let content = std::fs::read_to_string(&input)?;
            let value: serde_json::Value = serde_json::from_str(&content)?;

            let result = path.split('.').fold(Some(&value), |v, key| {
                v.and_then(|v| {
                    key.parse::<usize>().ok()
                        .and_then(|i| v.get(i))
                        .or_else(|| v.get(key))
                })
            });

            match result {
                Some(v) => println!("{}", serde_json::to_string_pretty(v)?),
                None => println!("路径 '{}' 未找到", path),
            }
        }
    }

    Ok(())
}
```

## 发布与分发

```bash
# 编译优化版本
cargo build --release
# 产物在 target/release/json-tool（约 2-5 MB）

# 安装到 ~/.cargo/bin
cargo install --path .

# 发布到 crates.io
cargo publish
```

## 推荐 CLI 生态

| 库 | 用途 |
|----|------|
| `clap` | 参数解析 |
| `serde` + `serde_json` | JSON 序列化 |
| `anyhow` | 错误处理 |
| `indicatif` | 进度条 |
| `colored` | 彩色输出 |
| `dialoguer` | 交互式提示 |
| `reqwest` | HTTP 客户端 |
| `tokio` | 异步运行时 |

## 小结

- `clap` derive 模式让参数解析声明式、类型安全
- `serde` 处理 JSON/TOML/YAML 序列化反序列化
- `anyhow` + `?` + `.context()` 优雅处理错误
- Rust CLI 编译为无依赖二进制，启动极快

---

下一章：[Web 后端开发](../16-web-backend/) →

