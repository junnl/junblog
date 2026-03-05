+++
date = '2026-03-05T10:10:00+08:00'
draft = false
title = '10. 闭包与迭代器'
weight = 10
+++

# 闭包与迭代器

闭包和迭代器是 Rust 函数式编程的核心，也是日常开发中使用频率最高的特性。

## 闭包（Closure）

闭包是可以捕获环境变量的匿名函数：

```rust
fn main() {
    // 基本语法
    let add = |a, b| a + b;
    println!("{}", add(2, 3)); // 5

    // 可标注类型
    let add_typed = |a: i32, b: i32| -> i32 { a + b };

    // 多行闭包
    let greeting = |name: &str| {
        let msg = format!("Hello, {}!", name);
        println!("{}", msg);
        msg
    };

    // 捕获环境变量
    let factor = 3;
    let multiply = |x| x * factor; // 捕获 factor
    println!("{}", multiply(5));     // 15
}
```

### 三种捕获方式

Rust 闭包通过三种方式捕获环境变量，对应三个 Trait：

| Trait | 捕获方式 | 说明 | 类比 |
|-------|---------|------|------|
| `Fn` | 不可变借用 `&T` | 只读访问 | 传 const 引用 |
| `FnMut` | 可变借用 `&mut T` | 可修改捕获的变量 | 传可变引用 |
| `FnOnce` | 获取所有权 `T` | 只能调用一次 | 传值（move） |

```rust
fn main() {
    // Fn — 不可变借用
    let name = String::from("Rust");
    let greet = || println!("Hello, {}", name); // 借用 name
    greet();
    greet(); // ✅ 可以多次调用
    println!("{}", name); // ✅ name 仍有效

    // FnMut — 可变借用
    let mut count = 0;
    let mut increment = || {
        count += 1; // 可变借用 count
        println!("count = {}", count);
    };
    increment(); // count = 1
    increment(); // count = 2

    // FnOnce — 获取所有权
    let name = String::from("Rust");
    let consume = move || {
        println!("Consumed: {}", name); // move 强制获取所有权
        drop(name); // name 被消耗
    };
    consume();
    // consume(); // ❌ 只能调用一次
    // println!("{}", name); // ❌ name 已被移动
}
```

### 闭包作为参数

```rust
fn apply<F: Fn(i32) -> i32>(f: F, x: i32) -> i32 {
    f(x)
}

fn apply_mut<F: FnMut()>(mut f: F, times: usize) {
    for _ in 0..times {
        f();
    }
}

fn main() {
    let double = |x| x * 2;
    println!("{}", apply(double, 5)); // 10

    let mut total = 0;
    apply_mut(|| total += 1, 3);
    println!("total = {}", total); // 3
}
```

## 迭代器（Iterator）

迭代器是 Rust 处理序列数据的零成本抽象：

```rust
trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
    // 还有 70+ 个默认方法（map, filter, fold...）
}
```

### 创建迭代器

```rust
fn main() {
    let v = vec![1, 2, 3];

    // 三种迭代器
    let _ = v.iter();       // 迭代 &T
    let _ = v.iter_mut();   // 迭代 &mut T（需要 mut v）
    let _ = v.into_iter();  // 迭代 T（消耗 v）

    // 范围迭代器
    let _ = 0..10;     // 0 到 9
    let _ = 0..=10;    // 0 到 10
}
```

### 适配器（Adapter） — 惰性转换

适配器创建新迭代器，**不立即执行**（惰性求值）：

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // map — 转换每个元素
    let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
    // [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

    // filter — 过滤元素
    let evens: Vec<&i32> = numbers.iter().filter(|x| *x % 2 == 0).collect();
    // [2, 4, 6, 8, 10]

    // 链式组合
    let result: Vec<i32> = numbers.iter()
        .filter(|x| *x % 2 == 0)   // 取偶数
        .map(|x| x * x)             // 平方
        .collect();
    // [4, 16, 36, 64, 100]

    // enumerate — 带索引
    for (i, val) in numbers.iter().enumerate() {
        println!("[{}] = {}", i, val);
    }

    // take / skip
    let first_3: Vec<&i32> = numbers.iter().take(3).collect();  // [1, 2, 3]
    let skip_3: Vec<&i32> = numbers.iter().skip(3).collect();   // [4, 5, ..., 10]

    // zip — 合并两个迭代器
    let names = vec!["Alice", "Bob", "Charlie"];
    let scores = vec![90, 85, 92];
    let pairs: Vec<_> = names.iter().zip(scores.iter()).collect();
    // [("Alice", 90), ("Bob", 85), ("Charlie", 92)]

    // flatten — 展平嵌套
    let nested = vec![vec![1, 2], vec![3, 4]];
    let flat: Vec<&i32> = nested.iter().flatten().collect();
    // [1, 2, 3, 4]
}
```

### 消费器（Consumer） — 触发执行

消费器消耗迭代器，产生最终结果：

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    let sum: i32 = numbers.iter().sum();              // 15
    let product: i32 = numbers.iter().product();      // 120
    let count = numbers.iter().count();                // 5
    let max = numbers.iter().max();                    // Some(5)
    let min = numbers.iter().min();                    // Some(1)
    let any_even = numbers.iter().any(|x| x % 2 == 0); // true
    let all_pos = numbers.iter().all(|x| *x > 0);      // true
    let found = numbers.iter().find(|x| **x == 3);     // Some(3)

    // fold — 最通用的聚合
    let sum = numbers.iter().fold(0, |acc, x| acc + x); // 15
    let csv = numbers.iter()
        .map(|x| x.to_string())
        .collect::<Vec<_>>()
        .join(", ");
    println!("{}", csv); // "1, 2, 3, 4, 5"
}
```

### 自定义迭代器

```rust
struct Counter {
    count: u32,
    max: u32,
}

impl Counter {
    fn new(max: u32) -> Counter {
        Counter { count: 0, max }
    }
}

impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<u32> {
        if self.count < self.max {
            self.count += 1;
            Some(self.count)
        } else {
            None
        }
    }
}

fn main() {
    let sum: u32 = Counter::new(5)
        .zip(Counter::new(5).skip(1))
        .map(|(a, b)| a * b)
        .filter(|x| x % 3 == 0)
        .sum();
    println!("{}", sum); // 6 + 12 = 18
}
```

## 性能：迭代器 vs for 循环

Rust 迭代器是**零成本抽象**——编译后的性能与手写 for 循环相同甚至更好（编译器可以更好地优化）。

## 小结

| 概念 | 说明 |
|------|------|
| `Fn` | 闭包不可变借用环境 |
| `FnMut` | 闭包可变借用环境 |
| `FnOnce` | 闭包获取环境所有权 |
| `move` | 强制闭包获取所有权 |
| 适配器 | `map`/`filter`/`take` 等，惰性求值 |
| 消费器 | `collect`/`sum`/`fold` 等，触发执行 |

---

下一章：[智能指针](../11-smart-pointers/) →

