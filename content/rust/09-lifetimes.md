+++
date = '2026-03-05T10:09:00+08:00'
draft = false
title = '09. 生命周期深入'
weight = 9
+++

# 生命周期深入

生命周期是 Rust 确保引用始终有效的机制。每个引用都有一个生命周期——它有效的作用域范围。

**TL;DR：** 生命周期标注不改变引用的实际存活时间，只是帮助编译器理解多个引用之间的关系。

## 为什么需要生命周期？

```rust
// ❌ 悬垂引用：r 指向已被释放的内存
// fn main() {
//     let r;
//     {
//         let x = 5;
//         r = &x;  // x 在这个块结束时被释放
//     }
//     println!("{}", r); // 编译错误！r 指向无效内存
// }

// ✅ 正确：r 和 x 在同一作用域
fn main() {
    let x = 5;
    let r = &x;
    println!("{}", r); // OK
}
```

## 函数签名中的生命周期

当函数接受多个引用并返回引用时，编译器无法自动推断返回的引用与哪个参数关联：

```rust
// ❌ 编译错误：返回值的生命周期是什么？
// fn longest(x: &str, y: &str) -> &str {
//     if x.len() > y.len() { x } else { y }
// }

// ✅ 用生命周期标注说明关系
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
// 含义：返回值的生命周期 = x 和 y 中较短的那个
```

```rust
fn main() {
    let string1 = String::from("long string");
    let result;
    {
        let string2 = String::from("xyz");
        result = longest(string1.as_str(), string2.as_str());
        println!("较长的是：{}", result); // ✅ string2 还活着
    }
    // println!("{}", result); // ❌ string2 已被释放，result 可能指向它
}
```

## 生命周期标注语法

```rust
&i32        // 引用
&'a i32     // 带生命周期标注的引用
&'a mut i32 // 带生命周期标注的可变引用
```

标注本身**不改变任何引用的存活时间**，它只是告诉编译器：这些引用之间有什么关系。

### 不同参数不同生命周期

```rust
// 返回值只与 x 相关，y 的生命周期无所谓
fn first_part<'a>(x: &'a str, y: &str) -> &'a str {
    x // 只返回 x，所以只需标注 x 的生命周期
}
```

## 结构体中的生命周期

当结构体持有引用时，必须标注生命周期：

```rust
// 含义：ImportantExcerpt 实例的生命周期不能超过 part 字段引用的数据
struct ImportantExcerpt<'a> {
    part: &'a str,
}

impl<'a> ImportantExcerpt<'a> {
    fn level(&self) -> i32 {
        3
    }

    // 返回值的生命周期与 self 相同
    fn announce_and_return(&self, announcement: &str) -> &str {
        println!("注意：{}", announcement);
        self.part
    }
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().unwrap();
    let excerpt = ImportantExcerpt { part: first_sentence };
    println!("{}", excerpt.part);
}
```

## 生命周期省略规则

大多数情况下不需要手动标注，编译器按以下规则自动推断：

**规则 1：** 每个引用参数获得独立的生命周期
```rust
fn foo(x: &str, y: &str)
// 推断为：fn foo<'a, 'b>(x: &'a str, y: &'b str)
```

**规则 2：** 如果只有一个输入生命周期，它被赋给所有输出引用
```rust
fn first_word(s: &str) -> &str
// 推断为：fn first_word<'a>(s: &'a str) -> &'a str  ← 无需手动标注
```

**规则 3：** 如果参数中有 `&self` 或 `&mut self`，self 的生命周期赋给所有输出引用
```rust
impl<'a> ImportantExcerpt<'a> {
    fn announce(&self, text: &str) -> &str { self.part }
    // 推断为：fn announce(&'a self, text: &'b str) -> &'a str
}
```

如果三条规则都无法确定，编译器报错，你必须手动标注。

## 'static 生命周期

`'static` 表示引用在**整个程序运行期间**都有效：

```rust
// 字符串字面量都是 'static
let s: &'static str = "I live forever";

// 常见于错误类型
fn error_message() -> &'static str {
    "something went wrong"
}
```

> ⚠️ 不要滥用 `'static`。遇到生命周期报错时，先分析引用关系，而非直接加 `'static`。

## 生命周期 + 泛型 + Trait Bound

三者可以组合使用：

```rust
use std::fmt::Display;

fn longest_with_announcement<'a, T>(
    x: &'a str,
    y: &'a str,
    ann: T,
) -> &'a str
where
    T: Display,
{
    println!("公告：{}", ann);
    if x.len() > y.len() { x } else { y }
}
```

## 常见生命周期模式速查

| 模式 | 示例 | 说明 |
|------|------|------|
| 输入=输出 | `fn f<'a>(s: &'a str) -> &'a str` | 最常见 |
| 多输入取最短 | `fn f<'a>(x: &'a str, y: &'a str) -> &'a str` | 返回值受两者约束 |
| 结构体持有引用 | `struct S<'a> { r: &'a str }` | 实例不能活过引用 |
| 不相关引用 | `fn f<'a, 'b>(x: &'a str, y: &'b str) -> &'a str` | 返回值只与 x 相关 |

## 小结

- 生命周期标注描述引用之间的关系，不改变实际存活时间
- 省略规则覆盖了大部分情况，通常不需要手动标注
- 结构体持有引用时必须标注生命周期
- `'static` 表示整个程序生命周期，谨慎使用
- 遇到生命周期错误：先画出引用关系图，再添加标注

---

下一章：[闭包与迭代器](../10-closures-iterators/) →

