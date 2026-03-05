+++
date = '2026-03-05T10:12:00+08:00'
draft = false
title = '12. 并发编程'
weight = 12
+++

# 并发编程

Rust 的口号是**无畏并发**（Fearless Concurrency）——所有权系统和类型系统在编译期阻止数据竞争。

## 线程（Thread）

```rust
use std::thread;
use std::time::Duration;

fn main() {
    // 创建线程
    let handle = thread::spawn(|| {
        for i in 1..5 {
            println!("子线程：{}", i);
            thread::sleep(Duration::from_millis(100));
        }
    });

    for i in 1..3 {
        println!("主线程：{}", i);
        thread::sleep(Duration::from_millis(100));
    }

    // 等待线程结束
    handle.join().unwrap();
}
```

### move 闭包

线程闭包通常需要 `move` 来获取变量所有权：

```rust
use std::thread;

fn main() {
    let name = String::from("Rust");

    // move 把 name 的所有权转移进闭包
    let handle = thread::spawn(move || {
        println!("Hello from {}", name);
    });

    // println!("{}", name); // ❌ name 已移入线程
    handle.join().unwrap();
}
```

## 消息传递（Channel）

Rust 推荐使用 channel 在线程间传递数据（"不要通过共享内存来通信，而是通过通信来共享内存"）：

```rust
use std::sync::mpsc; // mpsc = multiple producer, single consumer
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let messages = vec!["hello", "from", "thread"];
        for msg in messages {
            tx.send(msg).unwrap();
            thread::sleep(std::time::Duration::from_millis(200));
        }
    });

    // 接收消息（阻塞式）
    for received in rx {
        println!("收到：{}", received);
    }
}
```

### 多生产者

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();
    let tx2 = tx.clone(); // 克隆发送端

    thread::spawn(move || {
        tx.send("来自线程 1").unwrap();
    });

    thread::spawn(move || {
        tx2.send("来自线程 2").unwrap();
    });

    for msg in rx {
        println!("{}", msg);
    }
}
```

## 共享状态 — Mutex\<T\>

`Mutex<T>`（互斥锁）确保同一时刻只有一个线程访问数据：

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5);

    {
        let mut num = m.lock().unwrap(); // 获取锁，返回 MutexGuard
        *num = 6;
    } // MutexGuard 被 drop，自动释放锁

    println!("m = {:?}", m); // Mutex { data: 6 }
}
```

### Arc\<Mutex\<T\>\> — 多线程共享可变状态

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("最终结果：{}", *counter.lock().unwrap()); // 10
}
```

## RwLock\<T\> — 读写锁

允许多个读者或一个写者：

```rust
use std::sync::RwLock;

fn main() {
    let lock = RwLock::new(vec![1, 2, 3]);

    // 多个读者同时读
    {
        let r1 = lock.read().unwrap();
        let r2 = lock.read().unwrap();
        println!("{:?} {:?}", r1, r2); // 同时读 OK
    }

    // 写者独占
    {
        let mut w = lock.write().unwrap();
        w.push(4);
    }
}
```

## Send 与 Sync

这两个 marker trait 是 Rust 并发安全的基石：

| Trait | 含义 | 例子 |
|-------|------|------|
| `Send` | 值可以安全地**发送**到另一个线程 | 几乎所有类型 |
| `Sync` | 引用可以安全地在多线程间**共享** | `&T` is `Send` ↔ `T` is `Sync` |

不满足的类型：
- `Rc<T>` — 非 `Send`（引用计数非原子操作）→ 用 `Arc<T>` 替代
- `RefCell<T>` — 非 `Sync`（借用检查非线程安全）→ 用 `Mutex<T>` 替代

```rust
// 编译器自动阻止不安全的跨线程使用：
// let rc = Rc::new(5);
// thread::spawn(move || println!("{}", rc)); // ❌ Rc<i32> 不满足 Send
```

## 并发工具对比

| 方式 | 适用场景 | 类比 |
|------|---------|------|
| `thread::spawn` | CPU 密集型并行 | Java Thread |
| `mpsc::channel` | 线程间消息传递 | Go channel |
| `Mutex<T>` | 共享可变状态 | Java synchronized |
| `RwLock<T>` | 读多写少 | Java ReadWriteLock |
| `Arc<T>` | 跨线程共享所有权 | Java AtomicReference |

## 小结

- `thread::spawn` + `move` 创建线程
- Channel（`mpsc`）是线程间通信的首选方式
- `Arc<Mutex<T>>` 实现多线程共享可变状态
- `Send` / `Sync` 由编译器自动检查，防止数据竞争
- 优先使用消息传递，共享状态作为补充

---

下一章：[异步编程](../13-async/) →

