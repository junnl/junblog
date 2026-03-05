+++
date = '2026-03-05T10:06:00+08:00'
draft = false
title = '06. 常用集合'
weight = 6
+++

# 常用集合

Rust 标准库提供了几种常用的集合类型，数据存储在**堆**上，大小可在运行时变化。

## Vec\<T\> — 动态数组

```rust
fn main() {
    // 创建
    let mut v: Vec<i32> = Vec::new();
    let v2 = vec![1, 2, 3]; // vec! 宏快速创建

    // 添加元素
    v.push(1);
    v.push(2);
    v.push(3);

    // 访问元素
    let third = &v[2];            // 索引访问（越界会 panic）
    let third = v.get(2);         // 返回 Option<&T>（越界返回 None）

    match v.get(100) {
        Some(val) => println!("值：{}", val),
        None => println!("越界了"),  // ← 执行这行
    }

    // 遍历
    for val in &v {
        println!("{}", val);
    }

    // 可变遍历
    for val in &mut v {
        *val += 10; // 解引用后修改
    }
    println!("{:?}", v); // [11, 12, 13]

    // 常用方法
    println!("长度：{}", v.len());
    println!("是否为空：{}", v.is_empty());
    v.pop();                 // 移除最后一个元素
    v.remove(0);             // 移除指定索引
    v.contains(&12);         // 是否包含
    v.sort();                // 排序
    v.dedup();               // 去除连续重复
}
```

### 用枚举存储不同类型

```rust
enum Cell {
    Int(i32),
    Float(f64),
    Text(String),
}

fn main() {
    let row: Vec<Cell> = vec![
        Cell::Int(42),
        Cell::Float(3.14),
        Cell::Text(String::from("hello")),
    ];
}
```

## String — 字符串

Rust 有两种字符串类型：

| 类型 | 说明 | 存储位置 |
|------|------|---------|
| `&str` | 字符串切片（不可变引用） | 栈上指针，数据在任意位置 |
| `String` | 可增长、可变的字符串 | 堆上分配 |

```rust
fn main() {
    // 创建 String
    let mut s = String::new();
    let s2 = String::from("hello");
    let s3 = "hello".to_string();

    // 拼接
    s.push_str("hello");   // 追加字符串切片
    s.push('!');            // 追加单个字符

    let s4 = format!("{} {}", s2, s3); // format! 不会获取所有权

    // + 运算符（注意所有权）
    let s5 = s2 + " " + &s3; // s2 被移动，s3 被借用
    // println!("{}", s2); // ❌ s2 已无效

    // 长度与字节
    let chinese = String::from("你好");
    println!("字符数：{}", chinese.chars().count()); // 2
    println!("字节数：{}", chinese.len());            // 6（UTF-8）

    // 遍历
    for c in "hello".chars() {
        print!("{} ", c); // h e l l o
    }
    println!();

    // 切片（必须在 UTF-8 字符边界）
    let hello = &chinese[0..3]; // "你"（3 个字节）
    println!("{}", hello);
    // let bad = &chinese[0..2]; // ❌ panic! 不在字符边界
}
```

### &str vs String 选择指南

| 场景 | 用哪个 |
|------|--------|
| 函数参数 | `&str`（更灵活，接受 String 和 &str） |
| 结构体字段 | `String`（拥有所有权） |
| 字面量 | `&str`（`"hello"` 的类型就是 `&str`） |
| 需要修改 | `String` |

```rust
// ✅ 接受 &str 作为参数（String 可以自动转为 &str）
fn greet(name: &str) {
    println!("Hello, {}!", name);
}

fn main() {
    greet("world");                    // &str ✅
    greet(&String::from("Rust"));      // &String → &str ✅
}
```

## HashMap\<K, V\> — 哈希映射

```rust
use std::collections::HashMap;

fn main() {
    // 创建
    let mut scores: HashMap<String, i32> = HashMap::new();

    // 插入
    scores.insert(String::from("Alice"), 90);
    scores.insert(String::from("Bob"), 85);

    // 访问
    let alice_score = scores.get("Alice");     // Option<&i32>
    let unknown = scores.get("Charlie");       // None

    if let Some(score) = alice_score {
        println!("Alice: {}", score);
    }

    // 遍历
    for (name, score) in &scores {
        println!("{}: {}", name, score);
    }

    // 仅在 key 不存在时插入
    scores.entry(String::from("Alice")).or_insert(100); // Alice 已存在，不覆盖
    scores.entry(String::from("Charlie")).or_insert(70); // 插入 Charlie: 70

    // 基于旧值更新
    let text = "hello world hello rust";
    let mut word_count = HashMap::new();
    for word in text.split_whitespace() {
        let count = word_count.entry(word).or_insert(0);
        *count += 1;
    }
    println!("{:?}", word_count); // {"hello": 2, "world": 1, "rust": 1}
}
```

## 迭代器基础

迭代器是 Rust 处理集合数据的核心抽象：

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // iter() - 不可变引用迭代
    let sum: i32 = numbers.iter().sum();
    println!("总和：{}", sum); // 15

    // 链式调用
    let doubled: Vec<i32> = numbers.iter()
        .map(|x| x * 2)
        .collect();
    println!("{:?}", doubled); // [2, 4, 6, 8, 10]

    // 过滤
    let evens: Vec<&i32> = numbers.iter()
        .filter(|x| *x % 2 == 0)
        .collect();
    println!("{:?}", evens); // [2, 4]

    // 三种迭代方式
    // iter()      → 迭代 &T（借用）
    // iter_mut()  → 迭代 &mut T（可变借用）
    // into_iter() → 迭代 T（获取所有权）
}
```

## 小结

| 集合 | 用途 | 创建方式 |
|------|------|---------|
| `Vec<T>` | 动态数组 | `vec![1,2,3]` 或 `Vec::new()` |
| `String` | 可增长字符串 | `String::from("hi")` 或 `"hi".to_string()` |
| `HashMap<K,V>` | 键值对映射 | `HashMap::new()` |

---

下一章：[错误处理](../07-error-handling/) →

