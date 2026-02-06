---
name: cocos-skills
description: Cocos Creator 3.x 游戏开发最佳实践指南。涵盖性能优化、内存管理、渲染优化、资源管理、脚本编写等核心领域。适用于编写、审查或重构 Cocos Creator 项目代码时参考。
license: MIT
metadata:
  author: junblog
  version: "1.0.0"
  cocos-version: "3.x"
---

# Cocos Creator 3.x 最佳实践

针对 Cocos Creator 3.x 的游戏开发最佳实践指南，包含 8 大类别的优化规则，按影响程度排序，指导自动化重构和代码生成。

## 适用场景

在以下情况下参考这些指南：
- 编写新的 Cocos Creator 组件或场景
- 实现资源加载和管理逻辑
- 审查代码的性能问题
- 重构现有 Cocos 项目代码
- 优化游戏帧率和内存占用

## 规则分类（按优先级）

| 优先级 | 类别 | 影响 | 前缀 |
|--------|------|------|------|
| 1 | 性能优化 | CRITICAL | `performance-` |
| 2 | 内存管理 | CRITICAL | `memory-` |
| 3 | 渲染优化 | HIGH | `rendering-` |
| 4 | 资源管理 | HIGH | `resource-` |
| 5 | 脚本最佳实践 | MEDIUM | `scripting-` |
| 6 | UI 优化 | MEDIUM | `ui-` |
| 7 | 物理引擎 | LOW-MEDIUM | `physics-` |
| 8 | 架构模式 | LOW | `architecture-` |

## 快速参考

### 1. 性能优化 (CRITICAL)

- `performance-object-pooling` - 使用对象池避免频繁实例化和 GC
- `performance-batch-draw-calls` - 合批减少 Draw Call 数量
- `performance-cache-node-reference` - 缓存节点和组件引用
- `performance-avoid-getcomponent-update` - 避免在 update 中频繁调用 getComponent
- `performance-scheduler-optimization` - 合理使用调度器替代 update

### 2. 内存管理 (CRITICAL)

- `memory-texture-compression` - 选择合适的纹理压缩格式
- `memory-asset-release` - 正确释放不再使用的资源
- `memory-avoid-closure-leaks` - 避免闭包导致的内存泄漏
- `memory-node-pool` - 使用 NodePool 管理频繁创建销毁的节点

### 3. 渲染优化 (HIGH)

- `rendering-reduce-overdraw` - 减少过度绘制
- `rendering-sprite-atlas` - 使用图集减少 Draw Call
- `rendering-culling-strategy` - 实现视锥剔除策略
- `rendering-dynamic-batching` - 理解动态合批条件

### 4. 资源管理 (HIGH)

- `resource-bundle-strategy` - Asset Bundle 分包策略
- `resource-preload` - 资源预加载最佳实践
- `resource-dynamic-atlas` - 动态合图使用指南
- `resource-reference-count` - 资源引用计数管理

### 5. 脚本最佳实践 (MEDIUM)

- `scripting-decorator-usage` - 装饰器正确使用方式
- `scripting-lifecycle-hooks` - 生命周期钩子最佳实践
- `scripting-event-management` - 事件监听与移除
- `scripting-component-communication` - 组件间通信模式

### 6. UI 优化 (MEDIUM)

- `ui-scrollview-optimization` - ScrollView 虚拟列表优化
- `ui-label-cache` - Label 缓存模式选择
- `ui-layout-performance` - 布局组件性能优化
- `ui-touch-event` - 触摸事件优化

### 7. 物理引擎 (LOW-MEDIUM)

- `physics-collision-groups` - 碰撞分组优化
- `physics-rigidbody-sleep` - 刚体休眠策略
- `physics-raycast-optimization` - 射线检测优化

### 8. 架构模式 (LOW)

- `architecture-singleton` - 单例管理器模式
- `architecture-ecs-pattern` - ECS 架构实践
- `architecture-state-machine` - 状态机实现

## 使用方式

阅读各个规则文件获取详细说明和代码示例：

```
rules/performance-object-pooling.md
rules/memory-texture-compression.md
```

每个规则文件包含：
- 规则说明和影响程度
- 错误示例及问题分析
- 正确示例及最佳实践
- 相关参考和扩展阅读

## 完整文档

完整的规则文档请参阅：`AGENTS.md`

