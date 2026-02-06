---
title: 生命周期钩子最佳实践
impact: MEDIUM
impactDescription: 正确的初始化顺序，避免空引用和时序问题
tags: scripting, lifecycle, onLoad, start, update
---

## 生命周期钩子最佳实践

理解并正确使用 Cocos Creator 的生命周期钩子，确保初始化顺序正确。

**生命周期执行顺序：**

```
onLoad → onEnable → start → update → lateUpdate → onDisable → onDestroy
```

**各钩子的正确用法：**

```typescript
import { _decorator, Component, Node, director, Director, RigidBody2D } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LifecycleDemo')
export class LifecycleDemo extends Component {
    private _rb: RigidBody2D = null!;

    /**
     * onLoad: 组件首次激活时调用（仅一次）
     * 用途：初始化组件引用、注册全局事件
     * 注意：此时其他组件的 onLoad 可能还未执行
     */
    onLoad() {
        // ✅ 获取自身组件引用
        this._rb = this.getComponent(RigidBody2D)!;
        
        // ✅ 注册全局事件
        director.on(Director.EVENT_AFTER_UPDATE, this.onAfterUpdate, this);
    }

    /**
     * onEnable: 组件启用时调用（可多次）
     * 用途：注册节点级别的事件、启动定时器
     */
    onEnable() {
        // ✅ 注册节点事件
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        
        // ✅ 启动定时器
        this.schedule(this.checkEnemy, 1);
    }

    /**
     * start: 所有组件 onLoad 执行完毕后调用（仅一次）
     * 用途：依赖其他组件的初始化逻辑
     */
    start() {
        // ✅ 此时可以安全访问其他组件
        const otherComponent = this.node.parent?.getComponent(OtherComponent);
        otherComponent?.initialize();
    }

    /**
     * update: 每帧调用
     * 用途：游戏主循环逻辑
     */
    update(dt: number) {
        // ✅ 移动、输入处理等每帧逻辑
        this.handleInput(dt);
    }

    /**
     * lateUpdate: 所有 update 执行完毕后调用
     * 用途：相机跟随、后处理等需要在其他逻辑之后执行的操作
     */
    lateUpdate(dt: number) {
        // ✅ 相机跟随玩家
        this.followPlayer();
    }

    /**
     * onDisable: 组件禁用时调用（可多次）
     * 用途：移除节点级别的事件、停止定时器
     */
    onDisable() {
        // ✅ 移除节点事件
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        
        // ✅ 停止定时器
        this.unschedule(this.checkEnemy);
    }

    /**
     * onDestroy: 组件销毁时调用（仅一次）
     * 用途：清理全局事件、释放资源
     */
    onDestroy() {
        // ✅ 移除全局事件
        director.off(Director.EVENT_AFTER_UPDATE, this.onAfterUpdate, this);
        
        // ✅ 释放资源
        this.releaseResources();
    }

    private onTouchStart() { /* ... */ }
    private onAfterUpdate() { /* ... */ }
    private checkEnemy() { /* ... */ }
    private handleInput(dt: number) { /* ... */ }
    private followPlayer() { /* ... */ }
    private releaseResources() { /* ... */ }
}
```

**常见错误：**

| 错误 | 问题 | 解决方案 |
|------|------|----------|
| 在 onLoad 中访问其他组件 | 其他组件可能未初始化 | 移到 start 中 |
| 在 onEnable 中注册全局事件 | 多次启用会重复注册 | 移到 onLoad 中 |
| 忘记在 onDisable 中移除事件 | 禁用后仍响应事件 | 配对注册和移除 |
| 忘记在 onDestroy 中清理 | 内存泄漏 | 清理所有引用和事件 |

