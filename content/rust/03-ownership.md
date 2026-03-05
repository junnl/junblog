+++
date = '2026-03-05T10:03:00+08:00'
draft = false
title = '03. 所有权系统'
weight = 3
+++

# 所有权系统

所有权是 Rust 最独特、最核心的概念。理解它，你就掌握了 Rust 的灵魂。

**TL;DR：** Rust 通过编译期的所有权规则，在不需要垃圾回收器（GC）的情况下保证内存安全。

## 为什么需要所有权？

| 语言 | 内存管理方式 | 代价 |
|------|-------------|------|
| C/C++ | 手动 malloc/free | 容易内存泄漏、悬垂指针、double free |
| Java/Go | 垃圾回收（GC） | 运行时开销、GC 停顿 |
| **Rust** | **所有权系统（编译期）** | **零运行时开销，编译器保证安全** |

## 三条所有权规则

1. Rust 中每个值都有一个**所有者**（owner）
2. 同一时刻只能有**一个**所有者
3. 当所有者离开作用域，值被**自动释放**（drop）

```rust
fn main() {
    {
        let s = String::from("hello"); // s 是 "hello" 的所有者
        println!("{}", s);              // ✅ OK
    } // s 离开作用域 → 自动调用 drop → 内存释放

    // println!("{}", s); // ❌ 编译错误：s 已不存在
}
```

## 移动（Move）

赋值或传参时，所有权会**转移**（move），原变量失效：

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // 所有权从 s1 移动到 s2

    // println!("{}", s1); // ❌ 编译错误：value borrowed here after move
    println!("{}", s2);    // ✅ OK，s2 是新的所有者
}
```

> 💡 为什么不是复制？`String` 存在堆上，如果浅复制指针会导致两个变量指向同一块内存，离开作用域时会 double free。Rust 选择**移动**来避免这个问题。

### 函数传参也会移动

```rust
fn take_ownership(s: String) {
    println!("got: {}", s);
} // s 在此被 drop

fn main() {
    let s = String::from("hello");
    take_ownership(s);      // 所有权移入函数

    // println!("{}", s);   // ❌ s 已经无效
}
```

## 复制（Copy）

基本类型（栈上数据）实现了 `Copy` trait，赋值时会**复制**而非移动：

```rust
fn main() {
    let x = 5;
    let y = x;  // 复制，不是移动

    println!("x = {}, y = {}", x, y); // ✅ 都有效
}
```

实现 `Copy` 的类型：`i32`、`f64`、`bool`、`char`、元组（仅当所有成员都 Copy）。

## 引用与借用（References & Borrowing）

每次都转移所有权太麻烦，**引用**允许你使用值但不获取所有权：

```rust
fn calculate_length(s: &String) -> usize { // &String = 不可变引用
    s.len()
} // s 离开作用域，但它不拥有值，所以什么也不会被 drop

fn main() {
    let s = String::from("hello");
    let len = calculate_length(&s); // 借用 s，不转移所有权

    println!("'{}' 的长度是 {}", s, len); // ✅ s 仍然有效
}
```

### 可变引用

```rust
fn append_world(s: &mut String) {
    s.push_str(", world!");
}

fn main() {
    let mut s = String::from("hello");
    append_world(&mut s);
    println!("{}", s); // 输出：hello, world!
}
```

### 借用规则（核心！）

在任意时刻，你只能拥有以下两者之一：
- **一个**可变引用（`&mut T`）
- **任意数量**的不可变引用（`&T`）

```rust
fn main() {
    let mut s = String::from("hello");

    let r1 = &s;     // ✅ 不可变引用
    let r2 = &s;     // ✅ 多个不可变引用 OK
    println!("{} and {}", r1, r2);

    let r3 = &mut s;  // ✅ 此时 r1、r2 已不再使用
    println!("{}", r3);

    // 以下会报错：不能同时存在可变和不可变引用
    // let r4 = &s;
    // let r5 = &mut s;
    // println!("{}, {}", r4, r5); // ❌
}
```

> 💡 这条规则在编译期消除了**数据竞争**：不可能同时读写同一数据。

## 悬垂引用

Rust 编译器会阻止悬垂引用（dangling reference）：

```rust
// fn dangle() -> &String {    // ❌ 编译错误
//     let s = String::from("hello");
//     &s  // s 在函数结束时被释放，引用指向无效内存
// }

fn no_dangle() -> String {
    let s = String::from("hello");
    s  // 返回所有权，而非引用
}
```

## Slice 类型

Slice 是对集合中一段连续元素的引用，不拥有数据：

```rust
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();
    for (i, &byte) in bytes.iter().enumerate() {
        if byte == b' ' {
            return &s[0..i];
        }
    }
    &s[..]
}

fn main() {
    let s = String::from("hello world");
    let word = first_word(&s);
    println!("第一个单词：{}", word); // 输出：hello
}
```

## 所有权流转图

```
let s1 = String::from("hi");   s1 → [所有者]
let s2 = s1;                    s1 ✗（无效）  s2 → [所有者]
let s3 = &s2;                   s2 → [所有者]  s3 → [借用]
```

## 小结

| 概念 | 说明 |
|------|------|
| **所有权** | 每个值有且仅有一个所有者 |
| **移动** | 赋值/传参转移所有权，原变量失效 |
| **复制** | 实现 `Copy` 的类型（基本类型）赋值时复制 |
| **不可变引用** `&T` | 借用值，可以有多个 |
| **可变引用** `&mut T` | 可变借用，同时只能有一个 |
| **规则** | 不能同时存在可变引用和不可变引用 |

这套规则在**编译期**保证：无悬垂指针、无数据竞争、无 double free，且**零运行时开销**。

---

下一章：[复合类型](../04-compound-types/) →

