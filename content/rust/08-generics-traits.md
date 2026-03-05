+++
date = '2026-03-05T10:08:00+08:00'
draft = false
title = '08. 泛型与 Trait'
weight = 8
+++

# 泛型与 Trait

泛型和 Trait 是 Rust 实现多态和代码复用的两大支柱。

## 泛型（Generics）

### 泛型函数

```rust
// 不用泛型：需要为每种类型写一个函数
fn largest_i32(list: &[i32]) -> &i32 { /* ... */ }
fn largest_f64(list: &[f64]) -> &f64 { /* ... */ }

// 用泛型：一个函数处理所有类型
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in &list[1..] {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    let numbers = vec![34, 50, 25, 100, 65];
    println!("最大值：{}", largest(&numbers)); // 100

    let chars = vec!['y', 'm', 'a', 'q'];
    println!("最大值：{}", largest(&chars));   // y
}
```

### 泛型结构体

```rust
struct Point<T> {
    x: T,
    y: T,
}

// 不同类型的字段
struct MixedPoint<T, U> {
    x: T,
    y: U,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

// 仅为特定类型实现方法
impl Point<f64> {
    fn distance_from_origin(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

fn main() {
    let int_point = Point { x: 5, y: 10 };
    let float_point = Point { x: 1.0, y: 4.0 };
    let mixed = MixedPoint { x: 5, y: 3.14 };

    println!("距离：{}", float_point.distance_from_origin());
    // int_point.distance_from_origin(); // ❌ 只有 f64 版本有这个方法
}
```

> 💡 Rust 泛型是**零成本抽象**——编译器会为每个具体类型生成专用代码（单态化），运行时没有额外开销。

## Trait — 定义共享行为

Trait 类似 Java 的 interface 或 Go 的 interface，但更强大：

```rust
// 定义 Trait
trait Summary {
    fn summarize(&self) -> String;

    // 默认实现（可选）
    fn preview(&self) -> String {
        format!("{}...", &self.summarize()[..20.min(self.summarize().len())])
    }
}

struct Article {
    title: String,
    content: String,
}

struct Tweet {
    username: String,
    text: String,
}

// 为类型实现 Trait
impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{}: {}", self.title, &self.content[..50.min(self.content.len())])
    }
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("@{}: {}", self.username, self.text)
    }
}

fn main() {
    let tweet = Tweet {
        username: String::from("rustlang"),
        text: String::from("Rust 1.85 is out!"),
    };
    println!("{}", tweet.summarize());
}
```

## Trait Bound — 约束泛型

```rust
// 语法一：Trait Bound
fn notify<T: Summary>(item: &T) {
    println!("速报：{}", item.summarize());
}

// 语法二：impl Trait（语法糖，更简洁）
fn notify(item: &impl Summary) {
    println!("速报：{}", item.summarize());
}

// 多个约束
fn display_summary<T: Summary + std::fmt::Display>(item: &T) {
    println!("{}", item);
}

// where 子句（约束多时更清晰）
fn complex_function<T, U>(t: &T, u: &U) -> String
where
    T: Summary + Clone,
    U: std::fmt::Display + std::fmt::Debug,
{
    format!("{} - {:?}", t.summarize(), u)
}

// 返回实现了 Trait 的类型
fn create_summary() -> impl Summary {
    Tweet {
        username: String::from("bot"),
        text: String::from("auto generated"),
    }
}
```

## 常用标准库 Trait

| Trait | 作用 | 派生 |
|-------|------|------|
| `Debug` | `{:?}` 格式化输出 | `#[derive(Debug)]` |
| `Display` | `{}` 用户友好输出 | 需手动实现 |
| `Clone` | 深拷贝（`.clone()`） | `#[derive(Clone)]` |
| `Copy` | 隐式复制（栈上数据） | `#[derive(Copy, Clone)]` |
| `PartialEq` / `Eq` | 相等比较 `==` | `#[derive(PartialEq, Eq)]` |
| `PartialOrd` / `Ord` | 排序比较 `<` `>` | `#[derive(PartialOrd, Ord)]` |
| `Default` | 默认值 | `#[derive(Default)]` |
| `From` / `Into` | 类型转换 | 实现 `From` 自动获得 `Into` |

```rust
#[derive(Debug, Clone, PartialEq)]
struct User {
    name: String,
    age: u32,
}

impl std::fmt::Display for User {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}（{}岁）", self.name, self.age)
    }
}

// From/Into 转换
impl From<&str> for User {
    fn from(name: &str) -> Self {
        User { name: name.to_string(), age: 0 }
    }
}

fn main() {
    let user = User { name: "Alice".into(), age: 30 };
    println!("{:?}", user);  // Debug 输出
    println!("{}", user);    // Display 输出

    let user2: User = "Bob".into(); // 使用 Into
    println!("{}", user2);
}
```

## Trait Object — 动态分发

当需要在运行时决定具体类型时，使用 `dyn Trait`：

```rust
// 静态分发（编译期确定）：每种类型生成一份代码
fn print_summary(item: &impl Summary) {
    println!("{}", item.summarize());
}

// 动态分发（运行时确定）：通过 vtable 调用
fn print_any_summary(item: &dyn Summary) {
    println!("{}", item.summarize());
}

// 常见用法：存储不同类型到同一集合
fn get_summaries() -> Vec<Box<dyn Summary>> {
    vec![
        Box::new(Article { title: "Rust".into(), content: "great".into() }),
        Box::new(Tweet { username: "bot".into(), text: "hello".into() }),
    ]
}
```

| 方式 | 关键字 | 性能 | 灵活性 |
|------|--------|------|--------|
| 静态分发 | `impl Trait` / 泛型 | 零开销（单态化） | 编译期确定类型 |
| 动态分发 | `dyn Trait` | 有 vtable 开销 | 运行时确定类型 |

## 小结

- 泛型实现代码复用，编译期单态化，零运行时开销
- Trait 定义共享行为，类似接口但可有默认实现
- Trait Bound 约束泛型必须实现特定行为
- `#[derive()]` 自动派生常用 Trait
- 静态分发（`impl Trait`）性能最优，动态分发（`dyn Trait`）更灵活

---

下一章：[生命周期深入](../09-lifetimes/) →

