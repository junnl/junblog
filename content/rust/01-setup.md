+++
date = '2026-03-05T10:01:00+08:00'
draft = false
title = '01. 环境与工具链'
weight = 1
+++

# 环境与工具链

## Rust 是什么？

Rust 是一门**系统级编程语言**，由 Mozilla 研发，2015 年发布 1.0。一句话概括：

```
Rust = C/C++ 级性能 + 内存安全（无 GC）+ 现代语言体验
```

作为开发者，你可以这样理解：
- **C/C++** — 手动管理内存，性能极致，但容易出 bug
- **Go/Java** — 有 GC 自动回收内存，但运行时开销不可忽视
- **Rust** — 编译器在编译期检查内存安全，零运行时开销

## 安装 Rust

Rust 使用 `rustup` 管理工具链，类似 Node.js 的 `nvm`。

### Linux / macOS

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装完成后，重新加载环境变量
source $HOME/.cargo/env
```

### Windows

下载并运行 [rustup-init.exe](https://rustup.rs/)，按提示安装即可。

> 💡 Windows 用户需要先安装 [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)。

### 验证安装

```bash
rustc --version
# 输出：rustc 1.85.x (xxx 2025-xx-xx)

cargo --version
# 输出：cargo 1.85.x (xxx 2025-xx-xx)
```

## 核心工具

| 工具 | 作用 | 类比 |
|------|------|------|
| `rustc` | Rust 编译器 | `gcc` / `javac` |
| `cargo` | 包管理 + 构建工具 | `npm` + `webpack` 合体 |
| `rustup` | 工具链版本管理 | `nvm` / `fnm` |
| `rustfmt` | 代码格式化 | `prettier` |
| `clippy` | 代码检查（lint） | `eslint` |

## IDE 配置

推荐 **VS Code + rust-analyzer** 扩展：

1. 安装 [VS Code](https://code.visualstudio.com/)
2. 搜索并安装扩展 `rust-analyzer`
3. 可选安装 `Even Better TOML`（语法高亮 Cargo.toml）
4. 可选安装 `CodeLLDB`（调试支持）

安装后你将获得：自动补全、类型提示、内联错误、一键格式化。

## 第一个 Rust 程序

### 用 Cargo 创建项目（推荐）

```bash
# 创建新项目
cargo new hello-rust
cd hello-rust
```

生成的目录结构：

```
hello-rust/
├── Cargo.toml    # 项目配置（类似 package.json）
├── src/
│   └── main.rs   # 入口文件
```

查看 `Cargo.toml`：

```toml
[package]
name = "hello-rust"
version = "0.1.0"
edition = "2021"

[dependencies]
```

查看 `src/main.rs`：

```rust
fn main() {
    println!("Hello, world!");
}
```

### 编译并运行

```bash
# 编译 + 运行（开发模式）
cargo run
# 输出：Hello, world!

# 仅编译
cargo build

# 编译优化版本（发布用）
cargo build --release

# 检查代码是否能编译（不生成二进制，更快）
cargo check
```

## Cargo 常用命令速查

| 命令 | 作用 |
|------|------|
| `cargo new <name>` | 创建新项目 |
| `cargo run` | 编译并运行 |
| `cargo build` | 编译（debug 模式） |
| `cargo build --release` | 编译（release 模式，有优化） |
| `cargo check` | 快速检查编译错误 |
| `cargo test` | 运行测试 |
| `cargo fmt` | 格式化代码 |
| `cargo clippy` | 代码检查 |
| `cargo add <crate>` | 添加依赖 |
| `cargo doc --open` | 生成并打开文档 |

## 与其他语言对比

| 概念 | Rust | Go | C++ | Node.js |
|------|------|-----|-----|---------|
| 包管理 | `cargo` | `go mod` | CMake / vcpkg | `npm` |
| 入口函数 | `fn main()` | `func main()` | `int main()` | 无 |
| 编译产物 | 原生二进制 | 原生二进制 | 原生二进制 | 需要运行时 |
| 格式化 | `cargo fmt` | `gofmt` | `clang-format` | `prettier` |
| 依赖来源 | crates.io | pkg.go.dev | 无统一 | npmjs.com |

## 小结

- 使用 `rustup` 安装和管理 Rust 工具链
- `cargo` 是你日常开发的核心工具，集构建、测试、包管理于一体
- VS Code + rust-analyzer 提供优秀的开发体验
- `cargo run` 编译并运行，`cargo check` 快速检查错误

---

下一章：[基本语法](../02-basic-syntax/) →

