+++
date = '2026-03-05T10:00:00+08:00'
draft = false
title = 'Rust 从入门到实战'
weight = 1
+++

# Rust 从入门到实战

> 专为有编程基础的开发者设计的 Rust 系统级语言学习路径

## 为什么要学 Rust？

Rust 连续多年蝉联 Stack Overflow「最受喜爱语言」榜首，它带来了系统级编程的全新范式：

- 🔒 **内存安全无 GC** - 所有权系统在编译期消除数据竞争和空指针
- ⚡ **零成本抽象** - 高级语法编译后性能与手写 C/C++ 齐平
- 🧵 **无畏并发** - `Send`/`Sync` trait 让编译器替你检查线程安全
- 📦 **现代工具链** - Cargo 包管理 + rustfmt + clippy 开箱即用
- 🌍 **全栈适用** - CLI、Web 后端、WebAssembly、嵌入式、操作系统

## 教程目录

### 第一阶段：基础入门

| 章节 | 内容 | 难度 |
|------|------|------|
| [01. 环境与工具链](./01-setup/) | rustup、Cargo、IDE 配置、第一个程序 | ⭐ |
| [02. 基本语法](./02-basic-syntax/) | 变量、类型、函数、控制流 | ⭐ |
| [03. 所有权系统](./03-ownership/) | 所有权、移动、借用、生命周期入门 | ⭐⭐⭐ |
| [04. 复合类型](./04-compound-types/) | 结构体、枚举、Option、模式匹配 | ⭐⭐ |

### 第二阶段：核心概念

| 章节 | 内容 | 难度 |
|------|------|------|
| [05. 模块与包管理](./05-modules/) | mod、use、可见性、Cargo workspace | ⭐⭐ |
| [06. 常用集合](./06-collections/) | Vec、String、HashMap、迭代器基础 | ⭐⭐ |
| [07. 错误处理](./07-error-handling/) | panic!、Result、? 操作符、自定义错误 | ⭐⭐ |
| [08. 泛型与 Trait](./08-generics-traits/) | 泛型、Trait Bound、常用标准库 Trait | ⭐⭐⭐ |
| [09. 生命周期深入](./09-lifetimes/) | 标注语法、省略规则、'static | ⭐⭐⭐ |

### 第三阶段：进阶技能

| 章节 | 内容 | 难度 |
|------|------|------|
| [10. 闭包与迭代器](./10-closures-iterators/) | Fn/FnMut/FnOnce、迭代器适配器、惰性求值 | ⭐⭐⭐ |
| [11. 智能指针](./11-smart-pointers/) | Box、Rc/Arc、RefCell、内部可变性 | ⭐⭐⭐ |
| [12. 并发编程](./12-concurrency/) | 线程、Channel、Mutex、Send/Sync | ⭐⭐⭐ |
| [13. 异步编程](./13-async/) | async/await、Future、Tokio 运行时 | ⭐⭐⭐ |
| [14. 宏系统](./14-macros/) | 声明宏、过程宏、derive 宏 | ⭐⭐⭐ |

### 第四阶段：实战应用

| 章节 | 内容 | 难度 |
|------|------|------|
| [15. CLI 工具开发](./15-cli/) | clap、文件 I/O、serde 序列化 | ⭐⭐ |
| [16. Web 后端开发](./16-web-backend/) | Axum/Actix-web、REST API、数据库集成 | ⭐⭐⭐ |
| [17. 系统编程](./17-systems/) | FFI、unsafe、内存布局、网络编程 | ⭐⭐⭐ |
| [18. 测试与质量](./18-testing/) | 单元测试、集成测试、基准测试、clippy | ⭐⭐ |

### 第五阶段：高级专题

| 章节 | 内容 | 难度 |
|------|------|------|
| [19. 类型系统进阶](./19-advanced-types/) | 关联类型、Newtype、PhantomData、类型状态模式 | ⭐⭐⭐ |
| [20. 性能优化](./20-performance/) | 编译优化、内存分配策略、性能分析工具 | ⭐⭐⭐ |
| [21. 设计模式](./21-design-patterns/) | Builder、RAII、状态机、Rust 风格最佳实践 | ⭐⭐⭐ |

## 推荐学习路线

| 阶段 | 时长建议 | 里程碑 |
|------|---------|--------|
| 基础入门 | 2-3 周 | 能写简单程序，理解所有权 |
| 核心概念 | 3-4 周 | 能用泛型 + Trait 写库代码 |
| 进阶技能 | 4-6 周 | 能写并发/异步程序 |
| 实战应用 | 4-6 周 | 完成 2-3 个实战项目 |
| 高级专题 | 持续学习 | 能优化性能、设计复杂系统 |

## 学习建议

1. **所有权是核心** - 第 3 章是 Rust 的灵魂，务必反复理解
2. **边学边练** - 配合 [Rustlings](https://github.com/rust-lang/rustlings) 交互式练习
3. **拥抱编译器** - Rust 编译器是你最好的老师，认真读错误信息
4. **对比其他语言** - 文中会类比 C++/Go/TypeScript 帮助理解差异
5. **实战驱动** - 第四阶段用真实项目巩固所有知识

## 前置要求

- ✅ 有任意编程语言经验（C/C++/Go/Java/Python/TypeScript 等）
- ✅ 了解基本的命令行操作
- ✅ 熟悉变量、函数、循环等编程基础概念
- ✅ 了解内存栈与堆的区别（有帮助但非必需）

## 推荐资源

| 资源 | 说明 |
|------|------|
| [The Rust Book](https://doc.rust-lang.org/book/) | 官方教程，必读 |
| [Rust by Example](https://doc.rust-lang.org/rust-by-example/) | 示例驱动学习 |
| [Rustlings](https://github.com/rust-lang/rustlings) | 交互式练习题 |
| [Too Many Linked Lists](https://rust-unofficial.github.io/too-many-lists/) | 通过链表深入理解所有权 |
| [Tokio Tutorial](https://tokio.rs/tokio/tutorial) | 异步编程入门 |

---

准备好了吗？让我们从 [第一章：环境与工具链](./01-setup/) 开始！

