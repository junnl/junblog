+++
date = '2026-03-05T10:16:00+08:00'
draft = false
title = '16. Web 后端开发'
weight = 16
+++

# Web 后端开发

Rust Web 框架性能卓越（常年占据 TechEmpower 排行榜前列），本章以 **Axum** 为例构建 REST API。

## 为什么选 Axum？

| 框架 | 特点 | 维护方 |
|------|------|--------|
| **Axum** | 基于 Tokio/Tower 生态，类型安全、符合人体工学 | Tokio 团队 |
| Actix-web | 高性能，独立运行时 | 社区 |
| Rocket | 开发体验优先 | 社区 |

Axum 与 Tokio 生态深度集成，是当前社区的主流选择。

## 项目搭建

```bash
cargo new todo-api
cd todo-api
cargo add axum --features json
cargo add tokio --features full
cargo add serde --features derive
cargo add serde_json
cargo add tower-http --features cors
cargo add uuid --features v4
```

## Hello World

```rust
use axum::{Router, routing::get};

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(|| async { "Hello, Axum!" }));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("🚀 服务启动：http://localhost:3000");
    axum::serve(listener, app).await.unwrap();
}
```

## REST API 实战：TODO 服务

### 数据模型

```rust
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Todo {
    id: String,
    title: String,
    completed: bool,
}

#[derive(Debug, Deserialize)]
struct CreateTodo {
    title: String,
}

#[derive(Debug, Deserialize)]
struct UpdateTodo {
    title: Option<String>,
    completed: Option<bool>,
}
```

### 应用状态

```rust
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;

type Db = Arc<RwLock<HashMap<String, Todo>>>;

fn create_db() -> Db {
    Arc::new(RwLock::new(HashMap::new()))
}
```

### 路由与 Handler

```rust
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json, Router,
    routing::{get, post, put, delete},
};

// 查询所有
async fn list_todos(State(db): State<Db>) -> Json<Vec<Todo>> {
    let todos = db.read().await;
    Json(todos.values().cloned().collect())
}

// 创建
async fn create_todo(
    State(db): State<Db>,
    Json(input): Json<CreateTodo>,
) -> (StatusCode, Json<Todo>) {
    let todo = Todo {
        id: Uuid::new_v4().to_string(),
        title: input.title,
        completed: false,
    };
    db.write().await.insert(todo.id.clone(), todo.clone());
    (StatusCode::CREATED, Json(todo))
}

// 查询单个
async fn get_todo(
    State(db): State<Db>,
    Path(id): Path<String>,
) -> Result<Json<Todo>, StatusCode> {
    db.read().await
        .get(&id)
        .cloned()
        .map(Json)
        .ok_or(StatusCode::NOT_FOUND)
}

// 更新
async fn update_todo(
    State(db): State<Db>,
    Path(id): Path<String>,
    Json(input): Json<UpdateTodo>,
) -> Result<Json<Todo>, StatusCode> {
    let mut todos = db.write().await;
    let todo = todos.get_mut(&id).ok_or(StatusCode::NOT_FOUND)?;

    if let Some(title) = input.title { todo.title = title; }
    if let Some(completed) = input.completed { todo.completed = completed; }

    Ok(Json(todo.clone()))
}

// 删除
async fn delete_todo(
    State(db): State<Db>,
    Path(id): Path<String>,
) -> StatusCode {
    match db.write().await.remove(&id) {
        Some(_) => StatusCode::NO_CONTENT,
        None => StatusCode::NOT_FOUND,
    }
}
```

### 组装路由

```rust
use tower_http::cors::CorsLayer;

#[tokio::main]
async fn main() {
    let db = create_db();

    let app = Router::new()
        .route("/todos", get(list_todos).post(create_todo))
        .route("/todos/{id}", get(get_todo).put(update_todo).delete(delete_todo))
        .layer(CorsLayer::permissive())
        .with_state(db);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("🚀 TODO API 启动：http://localhost:3000");
    axum::serve(listener, app).await.unwrap();
}
```

### 测试 API

```bash
# 创建
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "学习 Rust"}'

# 查询所有
curl http://localhost:3000/todos

# 更新
curl -X PUT http://localhost:3000/todos/<id> \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# 删除
curl -X DELETE http://localhost:3000/todos/<id>
```

## 数据库集成（SQLx）

生产项目会用真实数据库替代内存 HashMap：

```rust
use sqlx::postgres::PgPoolOptions;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect("postgres://user:pass@localhost/tododb")
        .await?;

    // 编译期检查 SQL 语法
    let todos = sqlx::query_as!(Todo, "SELECT id, title, completed FROM todos")
        .fetch_all(&pool)
        .await?;

    // 插入
    sqlx::query!("INSERT INTO todos (id, title) VALUES ($1, $2)", id, title)
        .execute(&pool)
        .await?;

    Ok(())
}
```

## Web 生态推荐

| 库 | 用途 |
|----|------|
| `axum` | Web 框架 |
| `sqlx` | 异步数据库（PostgreSQL/MySQL/SQLite） |
| `tower-http` | 中间件（CORS、压缩、日志等） |
| `jsonwebtoken` | JWT 认证 |
| `tracing` | 结构化日志 |
| `reqwest` | HTTP 客户端 |
| `validator` | 请求参数校验 |

## 小结

- Axum 基于 Tokio 生态，类型安全的 Web 框架
- `State` 提取器共享应用状态
- `Json`、`Path`、`Query` 提取器自动解析请求
- Handler 返回值自动序列化为响应
- SQLx 支持编译期 SQL 检查

---

下一章：[系统编程](../17-systems/) →

