---
title: 减少过度绘制
impact: HIGH
impactDescription: 移动端 GPU 性能提升 20-40%
tags: rendering, overdraw, gpu, mobile, optimization
---

## 减少过度绘制

过度绘制（Overdraw）指同一像素被多次绘制。在移动端，GPU 填充率是主要瓶颈，减少过度绘制可显著提升性能。

**过度绘制的常见原因：**

1. **大面积透明区域**：图片周围有大量透明像素
2. **半透明 UI 叠加**：多层半透明面板叠加
3. **全屏特效**：全屏模糊、颜色滤镜
4. **不可见节点未隐藏**：被遮挡的节点仍在渲染

**优化策略 1：裁剪透明区域**

```
// ❌ 错误：512x512 的图片，实际内容只有 100x100
// 周围 412x412 的透明区域也会参与渲染

// ✅ 正确：使用 TexturePacker 的 Trim 功能
// 自动裁剪透明边缘，只保留实际内容
```

**优化策略 2：避免大面积半透明**

```typescript
// ❌ 错误：全屏半透明遮罩
@ccclass('BadMask')
export class BadMask extends Component {
    show() {
        // 全屏半透明，导致下层所有内容重绘
        this.node.getComponent(Sprite)!.color = new Color(0, 0, 0, 128);
    }
}

// ✅ 正确：使用不透明遮罩 + 镂空
@ccclass('GoodMask')
export class GoodMask extends Component {
    show() {
        // 使用 Mask 组件实现镂空效果
        // 或使用纯色不透明背景
        this.node.getComponent(Sprite)!.color = new Color(0, 0, 0, 255);
    }
}
```

**优化策略 3：隐藏被遮挡的节点**

```typescript
@ccclass('PanelManager')
export class PanelManager extends Component {
    @property([Node])
    panels: Node[] = [];

    showPanel(index: number) {
        // ✅ 隐藏其他面板，避免渲染被遮挡的内容
        this.panels.forEach((panel, i) => {
            panel.active = (i === index);
        });
    }
}
```

**优化策略 4：合理使用 RenderTexture**

```typescript
// 对于复杂但静态的 UI，可以渲染到 RenderTexture
// 后续只渲染一张纹理，减少 Draw Call 和过度绘制

@ccclass('StaticUICache')
export class StaticUICache extends Component {
    @property(Camera)
    uiCamera: Camera = null!;

    @property(Sprite)
    cachedSprite: Sprite = null!;

    cacheUI() {
        // 创建 RenderTexture
        const rt = new RenderTexture();
        rt.initialize({ width: 512, height: 512 });
        
        // 渲染 UI 到 RenderTexture
        this.uiCamera.targetTexture = rt;
        
        // 使用缓存的纹理
        const sf = new SpriteFrame();
        sf.texture = rt;
        this.cachedSprite.spriteFrame = sf;
        
        // 隐藏原始 UI
        this.uiCamera.node.active = false;
    }
}
```

**检测过度绘制：**

在 Cocos Creator 中，可以通过以下方式检测：

1. 使用 GPU 调试工具（如 Xcode GPU Frame Capture）
2. 观察帧率在复杂场景下的表现
3. 逐步隐藏节点，观察帧率变化

**过度绘制等级参考：**

| 等级 | 描述 | 建议 |
|------|------|------|
| 1x | 每个像素绘制 1 次 | 理想状态 |
| 2x | 每个像素绘制 2 次 | 可接受 |
| 3x | 每个像素绘制 3 次 | 需要优化 |
| 4x+ | 每个像素绘制 4 次以上 | 严重问题 |

