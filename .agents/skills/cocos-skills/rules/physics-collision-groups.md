---
title: 碰撞分组优化
impact: MEDIUM
impactDescription: 减少碰撞检测次数，物理性能提升 30-50%
tags: physics, collision, groups, optimization
---

## 碰撞分组优化

使用碰撞分组，只检测需要碰撞的对象之间的碰撞，避免不必要的碰撞检测。

**在项目设置中配置碰撞矩阵：**

1. 打开 `项目设置` → `物理`
2. 添加碰撞分组：Player、Enemy、Bullet、Wall、Pickup
3. 配置碰撞矩阵，只勾选需要碰撞的组合

**碰撞矩阵示例：**

|        | Player | Enemy | Bullet | Wall | Pickup |
|--------|--------|-------|--------|------|--------|
| Player | ❌     | ✅    | ❌     | ✅   | ✅     |
| Enemy  | ✅     | ❌    | ✅     | ✅   | ❌     |
| Bullet | ❌     | ✅    | ❌     | ✅   | ❌     |
| Wall   | ✅     | ✅    | ✅     | ❌   | ❌     |
| Pickup | ✅     | ❌    | ❌     | ❌   | ❌     |

**代码中设置碰撞分组：**

```typescript
import { _decorator, Component, RigidBody2D, Collider2D, Contact2DType, 
         PhysicsSystem2D, ERigidBody2DType } from 'cc';
const { ccclass, property } = _decorator;

// 定义碰撞分组（与项目设置对应）
// 注意：值必须是 2 的幂次方
export enum PhysicsGroup {
    DEFAULT = 1 << 0,   // 1
    PLAYER = 1 << 1,    // 2
    ENEMY = 1 << 2,     // 4
    BULLET = 1 << 3,    // 8
    WALL = 1 << 4,      // 16
    PICKUP = 1 << 5,    // 32
}

@ccclass('Player')
export class Player extends Component {
    private _collider: Collider2D = null!;

    onLoad() {
        // 获取碰撞体
        this._collider = this.getComponent(Collider2D)!;
        
        // 设置碰撞分组
        this._collider.group = PhysicsGroup.PLAYER;
        
        // 注册碰撞回调
        this._collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D) {
        // 根据对方的分组处理碰撞
        switch (otherCollider.group) {
            case PhysicsGroup.ENEMY:
                this.takeDamage(10);
                break;
            case PhysicsGroup.PICKUP:
                this.collectItem(otherCollider.node);
                break;
            case PhysicsGroup.WALL:
                // 墙壁碰撞由物理引擎自动处理
                break;
        }
    }

    onDestroy() {
        this._collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }
}
```

**子弹碰撞示例：**

```typescript
@ccclass('Bullet')
export class Bullet extends Component {
    @property
    damage: number = 10;

    private _collider: Collider2D = null!;

    onLoad() {
        this._collider = this.getComponent(Collider2D)!;
        this._collider.group = PhysicsGroup.BULLET;
        this._collider.on(Contact2DType.BEGIN_CONTACT, this.onHit, this);
    }

    onHit(selfCollider: Collider2D, otherCollider: Collider2D) {
        if (otherCollider.group === PhysicsGroup.ENEMY) {
            // 对敌人造成伤害
            const enemy = otherCollider.getComponent(Enemy);
            enemy?.takeDamage(this.damage);
        }
        
        // 子弹销毁（或回收到对象池）
        this.node.destroy();
    }

    onDestroy() {
        this._collider.off(Contact2DType.BEGIN_CONTACT, this.onHit, this);
    }
}
```

**性能对比：**

| 场景 | 无分组 | 有分组 |
|------|--------|--------|
| 100 个对象 | 4950 次检测 | ~500 次检测 |
| 碰撞检测时间 | 5ms | 0.5ms |

**最佳实践：**

1. **最小化碰撞组合**：只勾选真正需要碰撞的组合
2. **使用触发器**：不需要物理响应的碰撞使用 Sensor（触发器）
3. **简化碰撞形状**：使用简单的碰撞形状（Box、Circle）而非多边形
4. **合理设置碰撞层**：静态物体和动态物体分开

