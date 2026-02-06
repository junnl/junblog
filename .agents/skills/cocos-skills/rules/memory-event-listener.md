---
title: 正确管理事件监听避免内存泄漏
impact: HIGH
impactDescription: 避免闭包导致的内存泄漏，防止组件销毁后仍响应事件
tags: memory, event, listener, leak, closure
---

## 正确管理事件监听避免内存泄漏

事件监听是内存泄漏的常见原因。闭包会持有外部变量的引用，如果监听器未正确移除，会导致组件无法被 GC 回收。

**错误示例（事件监听导致内存泄漏）：**

```typescript
@ccclass('LeakyComponent')
export class LeakyComponent extends Component {
    onLoad() {
        // ❌ 匿名函数无法移除
        this.node.on(Node.EventType.TOUCH_START, () => {
            this.doSomething();
        });

        // ❌ 全局事件未在 onDestroy 中移除
        director.on(Director.EVENT_AFTER_UPDATE, () => {
            this.update();
        });

        // ❌ 第三方事件未移除
        window.addEventListener('resize', () => {
            this.onResize();
        });
    }
    
    // 没有 onDestroy，事件监听永远不会被移除
}
```

**正确示例（正确管理事件监听）：**

```typescript
import { _decorator, Component, Node, director, Director } from 'cc';
const { ccclass } = _decorator;

@ccclass('SafeComponent')
export class SafeComponent extends Component {
    // ✅ 将回调函数保存为类成员，便于移除
    private _onTouchStart = this.handleTouchStart.bind(this);
    private _onAfterUpdate = this.handleAfterUpdate.bind(this);
    private _onResize = this.handleResize.bind(this);

    onLoad() {
        // ✅ 使用命名函数，可以移除
        this.node.on(Node.EventType.TOUCH_START, this._onTouchStart);
        
        // ✅ 全局事件传入 target 参数
        director.on(Director.EVENT_AFTER_UPDATE, this._onAfterUpdate, this);
    }

    onEnable() {
        // ✅ 浏览器事件在 onEnable 中注册
        window.addEventListener('resize', this._onResize);
    }

    onDisable() {
        // ✅ 浏览器事件在 onDisable 中移除
        window.removeEventListener('resize', this._onResize);
    }

    onDestroy() {
        // ✅ 移除所有事件监听
        this.node.off(Node.EventType.TOUCH_START, this._onTouchStart);
        director.off(Director.EVENT_AFTER_UPDATE, this._onAfterUpdate, this);
    }

    private handleTouchStart() { /* ... */ }
    private handleAfterUpdate() { /* ... */ }
    private handleResize() { /* ... */ }
}
```

**更简洁的方式（使用 targetOff）：**

```typescript
@ccclass('SimpleComponent')
export class SimpleComponent extends Component {
    onLoad() {
        // ✅ 传入 this 作为 target
        this.node.on(Node.EventType.TOUCH_START, this.onTouch, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        director.on('custom-event', this.onCustomEvent, this);
    }

    onDestroy() {
        // ✅ 一次性移除所有以 this 为 target 的监听
        this.node.targetOff(this);
        director.targetOff(this);
    }

    private onTouch() { /* ... */ }
    private onTouchEnd() { /* ... */ }
    private onCustomEvent() { /* ... */ }
}
```

**事件监听检查清单：**

| 注册位置 | 移除位置 | 说明 |
|----------|----------|------|
| `onLoad` | `onDestroy` | 全局事件、单次注册 |
| `onEnable` | `onDisable` | 需要随组件启用/禁用的事件 |
| 动态注册 | 使用完立即移除 | 临时事件 |

**常见泄漏场景：**

1. **定时器未清除**：`schedule` 后忘记 `unschedule`
2. **Promise 回调**：组件销毁后 Promise 仍然 resolve
3. **Tween 动画**：组件销毁后 Tween 仍在执行
4. **第三方库事件**：WebSocket、第三方 SDK 的事件监听

