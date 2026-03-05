+++
date = '2026-03-05T10:18:00+08:00'
draft = false
title = '18. 测试与质量'
weight = 18
+++

# 测试与质量

Rust 内置了一流的测试框架，无需额外安装。`cargo test` 一条命令搞定单元测试、集成测试和文档测试。

## 单元测试

单元测试写在源文件内部的 `#[cfg(test)]` 模块中：

```rust
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

pub fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err("除数不能为零".to_string())
    } else {
        Ok(a / b)
    }
}

#[cfg(test)] // 只在 cargo test 时编译
mod tests {
    use super::*; // 导入父模块的所有内容

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn test_add_negative() {
        assert_eq!(add(-1, 1), 0);
    }

    #[test]
    fn test_divide() {
        let result = divide(10.0, 3.0).unwrap();
        assert!((result - 3.333).abs() < 0.01); // 浮点数比较
    }

    #[test]
    fn test_divide_by_zero() {
        assert!(divide(1.0, 0.0).is_err());
    }

    #[test]
    #[should_panic(expected = "溢出")]
    fn test_panic() {
        panic!("溢出了");
    }

    #[test]
    fn test_result() -> Result<(), String> {
        // 测试函数也可以返回 Result
        let result = divide(10.0, 2.0)?;
        assert_eq!(result, 5.0);
        Ok(())
    }
}
```

```bash
cargo test              # 运行所有测试
cargo test test_add     # 运行名称包含 "test_add" 的测试
cargo test -- --nocapture  # 显示 println! 输出
cargo test -- --test-threads=1  # 单线程运行（避免并发问题）
```

## 常用断言宏

| 宏 | 用途 | 示例 |
|----|------|------|
| `assert!(expr)` | 表达式为 true | `assert!(x > 0)` |
| `assert_eq!(a, b)` | 相等 | `assert_eq!(add(1,2), 3)` |
| `assert_ne!(a, b)` | 不相等 | `assert_ne!(result, 0)` |
| `#[should_panic]` | 期望 panic | 见上方示例 |

> 💡 `assert_eq!` 和 `assert_ne!` 要求类型实现 `PartialEq` 和 `Debug`（用于打印失败信息）。

## 集成测试

集成测试放在 `tests/` 目录下，测试公开 API：

```
my_project/
├── src/
│   └── lib.rs
├── tests/
│   ├── integration_test.rs
│   └── common/
│       └── mod.rs          # 共享测试工具
```

```rust
// tests/integration_test.rs
use my_project::add; // 只能访问公开 API

#[test]
fn test_add_integration() {
    assert_eq!(add(100, 200), 300);
}
```

```rust
// tests/common/mod.rs — 共享测试辅助函数
pub fn setup() -> String {
    "test_data".to_string()
}
```

```bash
cargo test --test integration_test  # 只运行指定集成测试文件
```

## 文档测试

文档注释中的代码块会被自动测试：

```rust
/// 计算两个数的最大公约数。
///
/// # Examples
///
/// ```
/// use my_project::gcd;
/// assert_eq!(gcd(12, 8), 4);
/// assert_eq!(gcd(7, 3), 1);
/// ```
pub fn gcd(mut a: u64, mut b: u64) -> u64 {
    while b != 0 {
        let temp = b;
        b = a % b;
        a = temp;
    }
    a
}
```

```bash
cargo test --doc  # 只运行文档测试
```

## 基准测试（Benchmark）

使用 `criterion` 库进行基准测试：

```toml
# Cargo.toml
[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }

[[bench]]
name = "my_benchmark"
harness = false
```

```rust
// benches/my_benchmark.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use my_project::add;

fn bench_add(c: &mut Criterion) {
    c.bench_function("add", |b| {
        b.iter(|| add(black_box(2), black_box(3)))
    });
}

criterion_group!(benches, bench_add);
criterion_main!(benches);
```

```bash
cargo bench  # 运行基准测试，生成 HTML 报告
```

## Clippy — 代码质量检查

Clippy 是 Rust 官方的 lint 工具，能发现常见错误和不良模式：

```bash
rustup component add clippy  # 安装
cargo clippy                  # 运行检查
cargo clippy -- -D warnings   # 将警告视为错误（CI 推荐）
```

常见 Clippy 建议：

```rust
// Clippy: 用 is_empty() 替代 len() == 0
if vec.len() == 0 { }  // ⚠️
if vec.is_empty() { }   // ✅

// Clippy: 用 unwrap_or_default() 替代 unwrap_or(Vec::new())
let v = opt.unwrap_or(Vec::new());  // ⚠️
let v = opt.unwrap_or_default();     // ✅
```

## rustfmt — 代码格式化

```bash
rustup component add rustfmt
cargo fmt          # 格式化所有代码
cargo fmt -- --check  # 检查格式（CI 用）
```

## 测试组织最佳实践

| 测试类型 | 位置 | 测试什么 |
|---------|------|---------|
| 单元测试 | `src/*.rs` 内 `#[cfg(test)]` | 内部逻辑、私有函数 |
| 集成测试 | `tests/*.rs` | 公开 API、模块协作 |
| 文档测试 | `///` 注释中 | API 使用示例 |
| 基准测试 | `benches/*.rs` | 性能回归 |

## 小结

- `#[test]` + `cargo test` 是内置的测试框架
- 单元测试在源文件内，集成测试在 `tests/` 目录
- 文档注释中的代码自动成为测试用例
- `criterion` 做基准测试，`clippy` 做代码质量检查
- `cargo fmt` 统一代码风格

---

下一章：[类型系统进阶](../19-advanced-types/) →

