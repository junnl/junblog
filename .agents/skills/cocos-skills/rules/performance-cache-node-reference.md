---
title: 缓存节点和组件引用
impact: HIGH
impactDescription: 避免每帧查找开销，update 性能提升 30-50%
tags: performance, cache, getComponent, optimization
---

## 缓存节点和组件引用

`getComponent`、`getChildByName`、`find` 等方法有查找开销，应在 `start` 或 `onLoad` 中缓存引用，避免在 `update` 中重复调用。

**错误示例（每帧查找组件）：**

```typescript
@ccclass('Player')
export class Player extends Component {
    update(dt: number) {
        // ❌ 每帧都在查找组件，性能浪费
        const rb = this.getComponent(RigidBody2D);
        const anim = this.getComponent(Animation);
        const label = this.node.getChildByName('ScoreLabel')?.getComponent(Label);
        
        rb?.applyForce(new Vec2(100, 0), new Vec2(0, 0), true);
        anim?.play('run');
        if (label) label.string = this.score.toString();
    }
}
```

**正确示例（缓存引用）：**

```typescript
import { _decorator, Component, RigidBody2D, Animation, Label, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Player')
export class Player extends Component {
    // 缓存组件引用
    private _rb: RigidBody2D = null!;
    private _anim: Animation = null!;
    private _scoreLabel: Label = null!;

    onLoad() {
        // ✅ 在 onLoad 中一次性获取并缓存
        this._rb = this.getComponent(RigidBody2D)!;
        this._anim = this.getComponent(Animation)!;
        this._scoreLabel = this.node.getChildByName('ScoreLabel')?.getComponent(Label)!;
    }

    update(dt: number) {
        // ✅ 直接使用缓存的引用，无查找开销
        this._rb.applyForce(new Vec2(100, 0), new Vec2(0, 0), true);
        this._anim.play('run');
        this._scoreLabel.string = this.score.toString();
    }
}
```

**需要缓存的常见方法：**

| 方法 | 开销 | 建议 |
|------|------|------|
| `getComponent()` | 中 | 必须缓存 |
| `getComponents()` | 高 | 必须缓存 |
| `getChildByName()` | 中 | 必须缓存 |
| `find()` | 高 | 必须缓存 |
| `node.children` | 低 | 频繁访问时缓存 |

**使用装饰器简化：**

```typescript
@ccclass('Player')
export class Player extends Component {
    // 使用 @property 在编辑器中直接拖拽引用
    @property(RigidBody2D)
    rb: RigidBody2D = null!;

    @property(Animation)
    anim: Animation = null!;

    @property(Label)
    scoreLabel: Label = null!;

    update(dt: number) {
        // 直接使用，无需 getComponent
        this.rb.applyForce(new Vec2(100, 0), new Vec2(0, 0), true);
    }
}
```

