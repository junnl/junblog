+++
date = '2026-03-05T10:20:00+08:00'
draft = false
title = '20. 性能优化'
weight = 20
+++

# 性能优化

Rust 的"零成本抽象"意味着高级特性（泛型、迭代器、trait）编译后与手写底层代码性能相同。但写出高性能代码仍需要理解编译器行为和系统原理。

## 编译优化

### Release 模式

```bash
cargo build           # Debug 模式：无优化，编译快
cargo build --release  # Release 模式：O3 优化，编译慢，运行快
```

```toml
# Cargo.toml — 自定义优化级别
[profile.release]
opt-level = 3       # 最高优化（默认）
lto = true           # 链接时优化（更小更快的二进制）
codegen-units = 1    # 单代码生成单元（更好的优化，更慢的编译）
panic = "abort"      # panic 时直接 abort（减小二进制体积）
strip = true         # 去除调试符号
```

### Debug 与 Release 性能差异

```rust
// 这段代码在 Debug 下可能慢 10-50 倍
fn sum_million() -> u64 {
    (1..=1_000_000u64).sum()
}
```

> ⚠️ **永远用 Release 模式做性能测试。** Debug 模式包含边界检查、溢出检查等，不代表真实性能。

## 零成本抽象实例

```rust
// 迭代器链 vs 手写循环 — 编译后性能相同
fn iterator_style(data: &[i32]) -> i32 {
    data.iter()
        .filter(|&&x| x > 0)
        .map(|&x| x * 2)
        .sum()
}

fn loop_style(data: &[i32]) -> i32 {
    let mut sum = 0;
    for &x in data {
        if x > 0 {
            sum += x * 2;
        }
    }
    sum
}
// 两者生成几乎相同的汇编代码
```

## 内存分配策略

### 减少堆分配

```rust
// ❌ 频繁分配
fn bad_concat(items: &[&str]) -> String {
    let mut result = String::new();
    for item in items {
        result += item; // 可能多次重新分配
    }
    result
}

// ✅ 预分配容量
fn good_concat(items: &[&str]) -> String {
    let total_len: usize = items.iter().map(|s| s.len()).sum();
    let mut result = String::with_capacity(total_len);
    for item in items {
        result.push_str(item);
    }
    result
}
```

### 栈 vs 堆

```rust
// 栈分配（快）
let array = [0u8; 1024]; // 固定大小，栈上

// 堆分配（灵活但慢）
let vec = vec![0u8; 1024]; // 动态大小，堆上

// 小字符串优化：某些实现会把短字符串放在栈上
// Rust 标准库的 String 总是堆分配
// 可以用 smartstring 或 compact_str crate 获得 SSO
```

### Cow — 写时复制

```rust
use std::borrow::Cow;

// 避免不必要的克隆
fn process(input: &str) -> Cow<str> {
    if input.contains("bad") {
        // 需要修改时才分配
        Cow::Owned(input.replace("bad", "good"))
    } else {
        // 不需要修改，零成本借用
        Cow::Borrowed(input)
    }
}
```

## 性能分析工具

### cargo bench + criterion

```bash
cargo bench  # 运行基准测试（见第 18 章）
```

### flamegraph — 火焰图

```bash
cargo install flamegraph
cargo flamegraph --release  # 生成 flamegraph.svg
```

### perf（Linux）

```bash
cargo build --release
perf record ./target/release/my_app
perf report
```

### cargo-instruments（macOS）

```bash
cargo install cargo-instruments
cargo instruments --release -t time
```

## 常见优化技巧

### 1. 避免不必要的克隆

```rust
// ❌ 不必要的 clone
fn process(data: Vec<String>) {
    for item in data.clone() { // 整个 Vec 被克隆
        println!("{}", item);
    }
}

// ✅ 用引用
fn process(data: &[String]) {
    for item in data {
        println!("{}", item);
    }
}
```

### 2. 使用迭代器而非索引

```rust
// ❌ 索引访问（有边界检查开销）
for i in 0..vec.len() {
    process(vec[i]);
}

// ✅ 迭代器（编译器可以消除边界检查）
for item in &vec {
    process(*item);
}
```

### 3. 选择合适的数据结构

| 操作 | Vec | HashMap | BTreeMap |
|------|-----|---------|----------|
| 随机访问 | O(1) | O(1) 均摊 | O(log n) |
| 插入 | O(1) 均摊 | O(1) 均摊 | O(log n) |
| 有序遍历 | ✅ | ❌ | ✅ |
| 内存局部性 | 优秀 | 一般 | 一般 |

### 4. 并行化

```rust
// 使用 rayon 实现数据并行
// cargo add rayon
use rayon::prelude::*;

fn parallel_sum(data: &[i64]) -> i64 {
    data.par_iter().sum() // 自动多线程
}

fn parallel_map(data: &mut [f64]) {
    data.par_iter_mut().for_each(|x| *x = x.sqrt());
}
```

## 优化清单

| 优先级 | 优化项 | 效果 |
|--------|--------|------|
| 🔴 高 | 算法复杂度 | 数量级提升 |
| 🔴 高 | 减少堆分配 | 显著提升 |
| 🟡 中 | Release + LTO | 2-10x |
| 🟡 中 | 预分配容量 | 减少重分配 |
| 🟢 低 | 并行化（rayon） | 线性加速 |
| 🟢 低 | SIMD | 特定场景 2-8x |

> 💡 **黄金法则：先测量，再优化。** 不要猜测瓶颈在哪里，用 flamegraph 和 benchmark 找到真正的热点。

## 小结

- Release 模式 + LTO 是最基本的优化
- 零成本抽象意味着迭代器和泛型不会带来运行时开销
- 减少堆分配、预分配容量是最常见的优化手段
- `Cow<T>` 实现写时复制，避免不必要的克隆
- 先用 flamegraph/criterion 定位瓶颈，再针对性优化

---

下一章：[设计模式](../21-design-patterns/) →

