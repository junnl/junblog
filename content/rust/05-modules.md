+++
date = '2026-03-05T10:05:00+08:00'
draft = false
title = '05. 模块与包管理'
weight = 5
+++

# 模块与包管理

## Rust 的代码组织层次

```
Workspace（工作区）
└── Package（包）          ← 一个 Cargo.toml
    └── Crate（crate）     ← 编译单元（bin 或 lib）
        └── Module（模块）  ← 代码组织
```

| 概念 | 说明 | 类比 |
|------|------|------|
| **Package** | 包含一个 `Cargo.toml`，可有多个 crate | npm package |
| **Crate** | 编译单元，分为 binary crate 和 library crate | 一个可编译的目标 |
| **Module** | 用 `mod` 组织代码，控制作用域和可见性 | 文件夹/命名空间 |

## 模块基础

### 内联模块

```rust
// src/main.rs
mod math {
    pub fn add(a: i32, b: i32) -> i32 {
        a + b
    }

    fn internal_helper() {
        // 默认私有，模块外不可访问
    }

    pub mod advanced {
        pub fn power(base: i32, exp: u32) -> i32 {
            (0..exp).fold(1, |acc, _| acc * base)
        }
    }
}

fn main() {
    println!("{}", math::add(2, 3));             // 5
    println!("{}", math::advanced::power(2, 10)); // 1024
    // math::internal_helper(); // ❌ 私有函数
}
```

### 文件模块（推荐方式）

项目变大后，模块应拆分为独立文件：

```
src/
├── main.rs
├── math.rs          ← mod math
└── math/
    └── advanced.rs  ← mod math::advanced
```

```rust
// src/main.rs
mod math; // 编译器会查找 src/math.rs 或 src/math/mod.rs

fn main() {
    println!("{}", math::add(2, 3));
    println!("{}", math::advanced::power(2, 10));
}
```

```rust
// src/math.rs
pub mod advanced; // 子模块，查找 src/math/advanced.rs

pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

```rust
// src/math/advanced.rs
pub fn power(base: i32, exp: u32) -> i32 {
    (0..exp).fold(1, |acc, _| acc * base)
}
```

## 可见性（pub）

默认一切私有。用 `pub` 关键字控制可见性：

```rust
mod outer {
    pub struct User {
        pub name: String,    // 公开字段
        email: String,       // 私有字段（即使结构体是 pub）
    }

    impl User {
        // 公开的构造函数（因为 email 是私有的，外部无法直接创建）
        pub fn new(name: String, email: String) -> User {
            User { name, email }
        }
    }

    pub enum Status {
        Active,   // 枚举变体跟随枚举的可见性
        Inactive, // 只要枚举是 pub，变体自动 pub
    }
}

fn main() {
    let user = outer::User::new("Alice".into(), "a@b.com".into());
    println!("{}", user.name);  // ✅
    // println!("{}", user.email); // ❌ 私有字段
}
```

| 关键字 | 可见范围 |
|--------|---------|
| 无 `pub` | 当前模块及子模块 |
| `pub` | 任何地方 |
| `pub(crate)` | 当前 crate 内 |
| `pub(super)` | 父模块 |

## use 关键字

`use` 将路径引入当前作用域，减少冗长的路径前缀：

```rust
// 引入模块内的函数
use math::add;
use math::advanced::power;

// 引入多个
use std::collections::{HashMap, HashSet};

// 引入所有公开项（谨慎使用）
use std::io::prelude::*;

// 重命名（避免冲突）
use std::fmt::Result as FmtResult;
use std::io::Result as IoResult;

// 重新导出
pub use math::add; // 外部可以通过当前模块访问 add
```

**惯例**：函数引入到父模块层级，类型直接引入。

```rust
use std::collections::HashMap; // 类型：直接引入
use std::io;                   // 函数：引入父模块
io::stdin();                   // 这样能看出 stdin 来自哪里
```

## Cargo Workspace

当项目包含多个相关 crate 时，使用 workspace：

```
my-project/
├── Cargo.toml          ← workspace 根配置
├── core/
│   ├── Cargo.toml
│   └── src/lib.rs
├── api/
│   ├── Cargo.toml
│   └── src/main.rs
└── cli/
    ├── Cargo.toml
    └── src/main.rs
```

```toml
# 根 Cargo.toml
[workspace]
members = ["core", "api", "cli"]

[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
```

```toml
# api/Cargo.toml
[dependencies]
core = { path = "../core" }
serde = { workspace = true }  # 继承 workspace 依赖版本
```

Workspace 优势：共享 `Cargo.lock`、共享编译缓存、统一依赖版本。

## 添加外部依赖

```bash
# 用 cargo add 添加依赖（推荐）
cargo add serde --features derive
cargo add tokio --features full

# 会自动修改 Cargo.toml：
# [dependencies]
# serde = { version = "1.0", features = ["derive"] }
# tokio = { version = "1", features = ["full"] }
```

## 小结

| 概念 | 说明 |
|------|------|
| `mod` | 定义模块，组织代码结构 |
| `pub` | 控制可见性，默认私有 |
| `use` | 引入路径到当前作用域 |
| 文件模块 | 一个文件就是一个模块 |
| workspace | 多 crate 项目管理 |
| `cargo add` | 添加外部依赖 |

---

下一章：[常用集合](../06-collections/) →

