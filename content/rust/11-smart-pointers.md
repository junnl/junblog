+++
date = '2026-03-05T10:11:00+08:00'
draft = false
title = '11. 智能指针'
weight = 11
+++

# 智能指针

智能指针是拥有数据所有权的指针，除了引用功能外还有额外行为（如引用计数、内部可变性等）。

## Box\<T\> — 堆分配

`Box<T>` 将数据放到堆上，栈上只保留指针（8 字节）：

```rust
fn main() {
    let b = Box::new(5); // 5 存在堆上
    println!("b = {}", b); // 自动解引用

    // 使用场景 1：递归类型（编译期大小未知）
    // 直接定义会报错：recursive type has infinite size
}

// 递归类型必须用 Box
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));
}
```

`Box` 使用场景：
- 递归类型（如链表、树）
- 大数据避免栈上复制
- 拥有某个实现了特定 Trait 的值（`Box<dyn Trait>`）

## Deref 与 Drop

```rust
use std::ops::Deref;

// Deref — 自动解引用
struct MyBox<T>(T);

impl<T> Deref for MyBox<T> {
    type Target = T;
    fn deref(&self) -> &T {
        &self.0
    }
}

// Drop — 离开作用域时自动调用（类似析构函数）
struct CustomDrop {
    name: String,
}

impl Drop for CustomDrop {
    fn drop(&mut self) {
        println!("{} 被释放了", self.name);
    }
}

fn main() {
    let a = CustomDrop { name: "a".into() };
    let b = CustomDrop { name: "b".into() };
    println!("创建完毕");
    // 提前释放
    drop(a); // 手动调用 std::mem::drop
    println!("a 已释放");
} // b 在此自动释放
// 输出顺序：创建完毕 → a 被释放了 → a 已释放 → b 被释放了
```

## Rc\<T\> — 引用计数（单线程）

当一个值需要有**多个所有者**时，使用 `Rc<T>`（Reference Counting）：

```rust
use std::rc::Rc;

fn main() {
    let a = Rc::new(String::from("hello"));
    println!("引用计数：{}", Rc::strong_count(&a)); // 1

    let b = Rc::clone(&a); // 增加引用计数，不是深拷贝
    println!("引用计数：{}", Rc::strong_count(&a)); // 2

    {
        let c = Rc::clone(&a);
        println!("引用计数：{}", Rc::strong_count(&a)); // 3
    } // c 被释放

    println!("引用计数：{}", Rc::strong_count(&a)); // 2
}
```

> ⚠️ `Rc<T>` 只允许**不可变**共享。需要可变？看下面的 `RefCell`。

## RefCell\<T\> — 内部可变性

`RefCell<T>` 把借用检查从编译期推迟到**运行时**：

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(vec![1, 2, 3]);

    // 运行时借用
    data.borrow_mut().push(4);              // 可变借用
    println!("{:?}", data.borrow());         // 不可变借用 → [1, 2, 3, 4]

    // 运行时借用规则同编译期：
    // 同一时刻只能有一个可变借用 OR 多个不可变借用
    // 违反规则会在运行时 panic（不是编译错误）
}
```

## Rc\<RefCell\<T\>\> — 多所有者 + 可变

组合 `Rc` 和 `RefCell` 实现多个所有者可变访问同一数据：

```rust
use std::rc::Rc;
use std::cell::RefCell;

#[derive(Debug)]
struct Node {
    value: i32,
    children: Vec<Rc<RefCell<Node>>>,
}

fn main() {
    let leaf = Rc::new(RefCell::new(Node {
        value: 3,
        children: vec![],
    }));

    let branch = Rc::new(RefCell::new(Node {
        value: 5,
        children: vec![Rc::clone(&leaf)],
    }));

    // 通过 leaf 修改值，branch 也能看到变化
    leaf.borrow_mut().value = 10;
    println!("branch: {:?}", branch.borrow());
}
```

## Arc\<T\> — 原子引用计数（多线程）

`Arc<T>` 是 `Rc<T>` 的线程安全版本（Atomic Reference Counting）：

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![1, 2, 3]);

    let handles: Vec<_> = (0..3).map(|i| {
        let data = Arc::clone(&data);
        thread::spawn(move || {
            println!("线程 {} 看到：{:?}", i, data);
        })
    }).collect();

    for h in handles {
        h.join().unwrap();
    }
}
```

多线程可变？用 `Arc<Mutex<T>>`（下一章详细讲）。

## 智能指针速查

| 类型 | 用途 | 线程安全 | 内部可变 |
|------|------|---------|---------|
| `Box<T>` | 堆分配，单一所有者 | ✅ | ❌ |
| `Rc<T>` | 多所有者，引用计数 | ❌ | ❌ |
| `Arc<T>` | 多所有者，原子引用计数 | ✅ | ❌ |
| `RefCell<T>` | 运行时借用检查 | ❌ | ✅ |
| `Cell<T>` | Copy 类型的内部可变性 | ❌ | ✅ |
| `Mutex<T>` | 互斥锁 | ✅ | ✅ |

### 常见组合

| 组合 | 场景 |
|------|------|
| `Rc<RefCell<T>>` | 单线程，多所有者 + 可变 |
| `Arc<Mutex<T>>` | 多线程，多所有者 + 可变 |
| `Box<dyn Trait>` | 动态分发（trait object） |

## 小结

- `Box<T>` 是最简单的智能指针，堆分配 + 单一所有者
- `Rc<T>` / `Arc<T>` 实现多所有者（单线程/多线程）
- `RefCell<T>` 提供内部可变性，借用检查推迟到运行时
- 选择原则：能用编译期检查就不用运行时检查

---

下一章：[并发编程](../12-concurrency/) →

