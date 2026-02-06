---
title: Asset Bundle 分包策略
impact: HIGH
impactDescription: 优化首包体积和加载速度，支持按需加载
tags: resource, bundle, loading, optimization
---

## Asset Bundle 分包策略

使用 Asset Bundle 将资源分包，实现按需加载，优化首包体积和加载速度。

**分包策略建议：**

```
bundles/
├── main/           # 主包：启动必需资源（Logo、Loading 界面）
├── common/         # 公共包：通用 UI、音效、字体
├── level-1/        # 关卡包：按关卡分包
├── level-2/
├── characters/     # 角色包：角色模型、动画
└── shop/           # 功能包：商店界面资源
```

**Bundle 配置（在 Cocos Creator 中）：**

1. 选中文件夹，在属性检查器中勾选 `配置为 Bundle`
2. 设置 Bundle 名称和优先级
3. 选择压缩类型（推荐 LZ4）

**加载 Bundle 的正确方式：**

```typescript
import { _decorator, Component, assetManager, Prefab, instantiate, Node } from 'cc';
const { ccclass } = _decorator;

@ccclass('BundleLoader')
export class BundleLoader extends Component {
    // 加载 Bundle
    async loadBundle(bundleName: string): Promise<AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err) {
                    console.error(`Failed to load bundle: ${bundleName}`, err);
                    reject(err);
                } else {
                    resolve(bundle);
                }
            });
        });
    }

    // 从 Bundle 加载资源
    async loadAssetFromBundle<T>(
        bundle: AssetManager.Bundle,
        path: string,
        type: typeof Asset
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            bundle.load(path, type, (err, asset) => {
                if (err) reject(err);
                else resolve(asset as T);
            });
        });
    }

    // 完整的关卡加载流程
    async loadLevel(levelId: number): Promise<Node> {
        // 1. 加载关卡 Bundle
        const bundle = await this.loadBundle(`level-${levelId}`);
        
        // 2. 从 Bundle 加载预制体
        const prefab = await this.loadAssetFromBundle<Prefab>(
            bundle,
            'level-prefab',
            Prefab
        );
        
        // 3. 实例化
        return instantiate(prefab);
    }

    // 释放 Bundle
    releaseBundle(bundleName: string) {
        const bundle = assetManager.getBundle(bundleName);
        if (bundle) {
            bundle.releaseAll();
            assetManager.removeBundle(bundle);
        }
    }
}
```

**带进度的加载：**

```typescript
async loadBundleWithProgress(
    bundleName: string,
    onProgress: (progress: number) => void
): Promise<void> {
    // 加载 Bundle
    const bundle = await this.loadBundle(bundleName);
    
    // 预加载 Bundle 中所有资源
    return new Promise((resolve, reject) => {
        bundle.loadDir(
            '/',
            (finished, total) => {
                onProgress(finished / total);
            },
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}
```

**Bundle 优先级设置：**

| Bundle 类型 | 优先级 | 说明 |
|-------------|--------|------|
| main | 10 | 最高，启动必需 |
| common | 8 | 高，通用资源 |
| 当前关卡 | 5 | 中，当前需要 |
| 预加载关卡 | 3 | 低，后台加载 |

**远程 Bundle 加载：**

```typescript
// 加载远程 Bundle（热更新场景）
async loadRemoteBundle(url: string, bundleName: string) {
    return new Promise((resolve, reject) => {
        assetManager.loadBundle(url, { version: '1.0.0' }, (err, bundle) => {
            if (err) reject(err);
            else resolve(bundle);
        });
    });
}
```

