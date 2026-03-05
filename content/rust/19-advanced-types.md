+++
date = '2026-03-05T10:19:00+08:00'
draft = false
title = '19. 类型系统进阶'
weight = 19
+++

# 类型系统进阶

Rust 的类型系统是图灵完备的，本章介绍高级类型技巧，让编译器帮你在编译期捕获更多错误。

## 关联类型（Associated Types）

关联类型让 trait 的实现者决定具体类型，比泛型参数更简洁：

```rust
// 标准库的 Iterator 就用了关联类型
trait Iterator {
    type Item; // 关联类型

    fn next(&mut self) -> Option<Self::Item>;
}

struct Counter {
    count: u32,
}

impl Iterator for Counter {
    type Item = u32; // 实现时指定具体类型

    fn next(&mut self) -> Option<u32> {
        self.count += 1;
        if self.count <= 5 { Some(self.count) } else { None }
    }
}
```

### 关联类型 vs 泛型参数

```rust
// 泛型参数：一个类型可以实现多次（不同的 T）
trait Convert<T> {
    fn convert(&self) -> T;
}

// 关联类型：一个类型只能实现一次
trait IntoString {
    type Output;
    fn into_string(&self) -> Self::Output;
}
```

| 选择 | 场景 |
|------|------|
| 关联类型 | 每个实现者只有一种合理的类型（如 Iterator::Item） |
| 泛型参数 | 同一类型需要多种实现（如 From\<T\>） |

## Newtype 模式

用元组结构体包装现有类型，获得类型安全：

```rust
// 防止混淆不同含义的 u64
struct UserId(u64);
struct OrderId(u64);

fn get_user(id: UserId) -> String {
    format!("User #{}", id.0)
}

fn main() {
    let user_id = UserId(42);
    let order_id = OrderId(100);

    get_user(user_id);    // ✅
    // get_user(order_id); // ❌ 编译错误：类型不匹配
}
```

### 为外部类型实现外部 Trait

Newtype 绕过孤儿规则（orphan rule）：

```rust
// 不能直接为 Vec<String> 实现 Display（两者都不是你定义的）
// 但可以用 Newtype 包装
struct Wrapper(Vec<String>);

impl std::fmt::Display for Wrapper {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}
```

## 类型别名

```rust
// 简化复杂类型签名
type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;
type Callback = Box<dyn Fn(i32) -> i32>;

// 标准库中的例子
// type io::Result<T> = Result<T, io::Error>;
```

## PhantomData — 幽灵数据

`PhantomData<T>` 告诉编译器"这个类型逻辑上拥有 T"，但不实际存储：

```rust
use std::marker::PhantomData;

// 带单位的类型安全度量
struct Length<Unit> {
    value: f64,
    _unit: PhantomData<Unit>, // 零大小，仅用于类型检查
}

struct Meters;
struct Feet;

impl<Unit> Length<Unit> {
    fn new(value: f64) -> Self {
        Length { value, _unit: PhantomData }
    }
}

fn add_lengths<U>(a: Length<U>, b: Length<U>) -> Length<U> {
    Length::new(a.value + b.value)
}

fn main() {
    let a = Length::<Meters>::new(3.0);
    let b = Length::<Meters>::new(4.0);
    let c = add_lengths(a, b); // ✅

    let d = Length::<Feet>::new(5.0);
    // add_lengths(c, d); // ❌ 不能混合 Meters 和 Feet
}
```

## Typestate 模式 — 编译期状态机

用类型系统编码状态转换，非法状态在编译期就被拒绝：

```rust
// 状态标记（零大小类型）
struct Draft;
struct Published;

struct Article<State> {
    title: String,
    content: String,
    _state: PhantomData<State>,
}

// 只有 Draft 状态可以编辑
impl Article<Draft> {
    fn new(title: String) -> Self {
        Article { title, content: String::new(), _state: PhantomData }
    }

    fn edit(&mut self, content: String) {
        self.content = content;
    }

    // 发布：Draft → Published（消耗旧值，返回新类型）
    fn publish(self) -> Article<Published> {
        Article {
            title: self.title,
            content: self.content,
            _state: PhantomData,
        }
    }
}

// 只有 Published 状态可以获取链接
impl Article<Published> {
    fn permalink(&self) -> String {
        format!("/posts/{}", self.title.to_lowercase().replace(' ', "-"))
    }
    // 没有 edit 方法 — 已发布文章不可编辑
}

fn main() {
    let mut draft = Article::<Draft>::new("Rust 类型系统".into());
    draft.edit("内容...".into());

    let published = draft.publish();
    println!("{}", published.permalink());

    // published.edit("...".into()); // ❌ 编译错误：Published 没有 edit 方法
    // draft.publish();              // ❌ 编译错误：draft 已被 move
}
```

## 高阶 Trait Bound（HRTB）

`for<'a>` 语法表示"对所有生命周期都成立"：

```rust
// 接受一个能处理任意生命周期引用的闭包
fn apply_to_ref<F>(f: F, value: &str) -> String
where
    F: for<'a> Fn(&'a str) -> String,
{
    f(value)
}

fn main() {
    let result = apply_to_ref(|s| s.to_uppercase(), "hello");
    println!("{}", result); // HELLO
}
```

> 大多数情况下编译器会自动推断 HRTB，你很少需要手写。

## 小结

| 技巧 | 用途 | 类比 |
|------|------|------|
| 关联类型 | trait 中的类型占位符 | Java 泛型接口 |
| Newtype | 类型安全包装 | Java 值对象 |
| PhantomData | 零成本类型标记 | — |
| Typestate | 编译期状态机 | — |
| HRTB | 通用生命周期约束 | — |

---

下一章：[性能优化](../20-performance/) →

