+++
date = '2026-03-05T10:17:00+08:00'
draft = false
title = '17. 系统编程'
weight = 17
+++

# 系统编程

Rust 的定位就是系统级语言，本章介绍 unsafe、FFI、内存布局和网络编程。

## unsafe Rust

Rust 的安全保证来自编译器，但有些操作编译器无法验证。`unsafe` 块告诉编译器"我知道我在做什么"：

```rust
fn main() {
    // unsafe 允许的 5 种操作：
    // 1. 解引用裸指针
    // 2. 调用 unsafe 函数
    // 3. 访问/修改可变静态变量
    // 4. 实现 unsafe trait
    // 5. 访问 union 的字段

    let mut num = 5;
    let r1 = &num as *const i32;  // 裸指针（不可变）
    let r2 = &mut num as *mut i32; // 裸指针（可变）

    // 创建裸指针是安全的，解引用需要 unsafe
    unsafe {
        println!("r1 = {}", *r1);
        println!("r2 = {}", *r2);
    }
}
```

### 安全抽象

常见模式：unsafe 内部封装为安全的外部 API：

```rust
// 标准库的 split_at_mut 内部就用了 unsafe
fn split_at_mut(values: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = values.len();
    let ptr = values.as_mut_ptr();
    assert!(mid <= len);

    unsafe {
        (
            std::slice::from_raw_parts_mut(ptr, mid),
            std::slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}
```

> 💡 **原则：** 尽量减少 unsafe 代码量，将其封装在安全接口后面。

## FFI — 与 C 交互

### 调用 C 函数

```rust
// 声明外部 C 函数
extern "C" {
    fn abs(input: i32) -> i32;
    fn sqrt(x: f64) -> f64;
}

fn main() {
    unsafe {
        println!("abs(-3) = {}", abs(-3));    // 3
        println!("sqrt(9) = {}", sqrt(9.0));  // 3.0
    }
}
```

### 暴露 Rust 函数给 C

```rust
// 让 Rust 函数可以被 C 调用
#[no_mangle]
pub extern "C" fn rust_add(a: i32, b: i32) -> i32 {
    a + b
}
```

### 使用 C 库（bindgen）

```toml
# Cargo.toml
[build-dependencies]
bindgen = "0.71"
```

```rust
// build.rs — 自动生成 C 库的 Rust 绑定
fn main() {
    println!("cargo:rustc-link-lib=mylib");
    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .generate()
        .expect("无法生成绑定");
    bindings.write_to_file("src/bindings.rs").expect("写入失败");
}
```

## 内存布局

```rust
use std::mem;

#[repr(C)] // 使用 C 的内存布局（FFI 必须）
struct Point {
    x: f64,
    y: f64,
}

// 默认 Rust 会重排字段以优化对齐
struct RustLayout {
    a: u8,   // 1 字节
    b: u64,  // 8 字节
    c: u16,  // 2 字节
}

fn main() {
    println!("Point 大小：{} 字节", mem::size_of::<Point>());       // 16
    println!("Point 对齐：{} 字节", mem::align_of::<Point>());      // 8
    println!("RustLayout 大小：{}", mem::size_of::<RustLayout>());  // 可能是 16（Rust 优化）

    // Option<&T> 和 &T 大小相同（空指针优化）
    println!("&i32: {}", mem::size_of::<&i32>());              // 8
    println!("Option<&i32>: {}", mem::size_of::<Option<&i32>>()); // 8（零成本！）
}
```

### repr 属性

| 属性 | 说明 |
|------|------|
| `#[repr(C)]` | C 兼容布局（FFI 用） |
| `#[repr(transparent)]` | 与内部类型布局相同（Newtype 用） |
| `#[repr(packed)]` | 无填充对齐（谨慎使用） |
| `#[repr(align(N))]` | 指定最小对齐 |

## 网络编程

### TCP 客户端/服务器

```rust
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::thread;

// 服务器
fn start_server() -> std::io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:7878")?;
    println!("监听 127.0.0.1:7878");

    for stream in listener.incoming() {
        let stream = stream?;
        thread::spawn(move || handle_client(stream));
    }
    Ok(())
}

fn handle_client(mut stream: TcpStream) {
    let mut buffer = [0u8; 512];
    let n = stream.read(&mut buffer).unwrap();
    let request = String::from_utf8_lossy(&buffer[..n]);
    println!("收到：{}", request);

    let response = "HTTP/1.1 200 OK\r\nContent-Length: 5\r\n\r\nhello";
    stream.write_all(response.as_bytes()).unwrap();
}

// 客户端
fn send_request() -> std::io::Result<()> {
    let mut stream = TcpStream::connect("127.0.0.1:7878")?;
    stream.write_all(b"GET / HTTP/1.1\r\n\r\n")?;

    let mut response = String::new();
    stream.read_to_string(&mut response)?;
    println!("响应：{}", response);
    Ok(())
}
```

## 小结

| 概念 | 说明 |
|------|------|
| `unsafe` | 5 种超能力，应封装为安全 API |
| FFI | `extern "C"` 与 C 互调 |
| `#[repr(C)]` | 确保内存布局与 C 兼容 |
| 裸指针 | `*const T` / `*mut T`，unsafe 才能解引用 |
| TCP | `std::net` 提供同步网络，Tokio 提供异步 |

---

下一章：[测试与质量](../18-testing/) →

