---
title: 使用对象池避免频繁 GC
impact: CRITICAL
impactDescription: 避免 GC 导致的卡顿，帧率提升 20-50%
tags: performance, gc, object-pool, memory
---

## 使用对象池避免频繁 GC

频繁创建和销毁对象会触发垃圾回收（GC），导致游戏卡顿。使用对象池复用对象可以显著减少 GC 压力。

**错误示例（每次都创建新节点）：**

```typescript
@ccclass('BulletManager')
export class BulletManager extends Component {
    @property(Prefab)
    bulletPrefab: Prefab = null!;

    fire() {
        // ❌ 每次发射都实例化新节点
        const bullet = instantiate(this.bulletPrefab);
        bullet.parent = this.node;
    }

    onBulletHit(bullet: Node) {
        // ❌ 直接销毁，触发 GC
        bullet.destroy();
    }
}
```

**正确示例（使用 NodePool）：**

```typescript
import { _decorator, Component, Prefab, instantiate, NodePool, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BulletManager')
export class BulletManager extends Component {
    @property(Prefab)
    bulletPrefab: Prefab = null!;

    private _pool: NodePool = new NodePool();

    fire() {
        // ✅ 优先从对象池获取
        let bullet = this._pool.get();
        if (!bullet) {
            bullet = instantiate(this.bulletPrefab);
        }
        bullet.parent = this.node;
        // 重置子弹状态
        bullet.getComponent(Bullet)?.reset();
    }

    onBulletHit(bullet: Node) {
        // ✅ 回收到对象池而不是销毁
        this._pool.put(bullet);
    }

    onDestroy() {
        // 组件销毁时清理对象池
        this._pool.clear();
    }
}
```

**对象池使用场景：**

- 子弹、特效等频繁创建销毁的对象
- 敌人、道具等可复用的游戏对象
- UI 列表项（如排行榜、背包格子）

**性能对比：**

| 场景 | 无对象池 | 有对象池 |
|------|----------|----------|
| 100 发子弹/秒 | GC 频繁，卡顿明显 | 无 GC，流畅 |
| 内存分配 | 持续增长 | 稳定 |
| 帧率 | 波动大 | 稳定 60fps |

