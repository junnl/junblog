---
title: 正确释放不再使用的资源
impact: CRITICAL
impactDescription: 防止内存持续增长，避免 OOM 崩溃
tags: memory, asset, release, resource-management
---

## 正确释放不再使用的资源

动态加载的资源需要手动释放，否则会一直占用内存，最终导致内存溢出（OOM）崩溃。

**错误示例（只加载不释放）：**

```typescript
@ccclass('LevelManager')
export class LevelManager extends Component {
    async loadLevel(levelId: number) {
        // ❌ 加载新关卡，但没有释放旧关卡资源
        const prefab = await new Promise<Prefab>((resolve, reject) => {
            resources.load(`levels/level_${levelId}`, Prefab, (err, asset) => {
                if (err) reject(err);
                else resolve(asset);
            });
        });
        
        const level = instantiate(prefab);
        level.parent = this.node;
    }
}
```

**正确示例（加载前释放旧资源）：**

```typescript
import { _decorator, Component, Prefab, Node, instantiate, resources } from 'cc';
const { ccclass } = _decorator;

@ccclass('LevelManager')
export class LevelManager extends Component {
    private _currentLevelPrefab: Prefab | null = null;
    private _currentLevel: Node | null = null;

    async loadLevel(levelId: number) {
        // ✅ 先释放旧资源
        this.releaseCurrentLevel();

        // 加载新资源
        this._currentLevelPrefab = await new Promise<Prefab>((resolve, reject) => {
            resources.load(`levels/level_${levelId}`, Prefab, (err, asset) => {
                if (err) reject(err);
                else resolve(asset);
            });
        });
        
        this._currentLevel = instantiate(this._currentLevelPrefab);
        this._currentLevel.parent = this.node;
    }

    private releaseCurrentLevel() {
        // 销毁节点
        if (this._currentLevel) {
            this._currentLevel.destroy();
            this._currentLevel = null;
        }
        
        // 释放资源
        if (this._currentLevelPrefab) {
            resources.release(this._currentLevelPrefab);
            this._currentLevelPrefab = null;
        }
    }

    onDestroy() {
        this.releaseCurrentLevel();
    }
}
```

**资源释放最佳实践：**

```typescript
// 1. 使用 addRef/decRef 管理引用计数
const asset = await loadAsset('path/to/asset');
asset.addRef();  // 增加引用，防止被自动释放

// 使用完毕后
asset.decRef();  // 减少引用，计数为 0 时自动释放

// 2. 释放整个 Bundle
const bundle = await loadBundle('level-1');
// 使用完毕后
bundle.releaseAll();  // 释放 Bundle 中所有资源
assetManager.removeBundle(bundle);  // 移除 Bundle

// 3. 释放未使用的资源
assetManager.releaseUnusedAssets();  // 释放所有引用计数为 0 的资源
```

**常见内存泄漏场景：**

| 场景 | 问题 | 解决方案 |
|------|------|----------|
| 切换场景 | 旧场景资源未释放 | 场景切换前调用 releaseAll |
| 动态加载 | 加载后未记录引用 | 使用 Map 记录已加载资源 |
| 预制体实例化 | 只销毁节点不释放预制体 | 同时释放预制体资源 |
| 纹理/音频 | 临时加载后未释放 | 使用完立即释放 |

