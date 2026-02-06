---
title: 使用图集减少 Draw Call
impact: HIGH
impactDescription: Draw Call 可减少 80%+，显著提升渲染性能
tags: rendering, sprite-atlas, draw-call, batching
---

## 使用图集减少 Draw Call

每个 Draw Call 都有 CPU 开销。将多张小图合并成图集（SpriteAtlas），可以大幅减少 Draw Call 数量。

**错误示例（图片分散，无法合批）：**

```
assets/
├── ui/
│   ├── btn_start.png      # 单独图片 → 1 Draw Call
│   ├── btn_setting.png    # 单独图片 → 1 Draw Call
│   ├── icon_coin.png      # 单独图片 → 1 Draw Call
│   └── icon_gem.png       # 单独图片 → 1 Draw Call
# 总计：4 Draw Calls
```

**正确示例（打包成图集）：**

```
assets/
├── ui/
│   ├── ui-atlas.plist     # 图集配置
│   └── ui-atlas.png       # 合并后的图集
# 总计：1 Draw Call（如果渲染顺序连续）
```

**图集最佳实践：**

```typescript
// 按功能模块划分图集
assets/
├── atlas/
│   ├── ui-common.plist      // 通用 UI 元素（按钮、图标）
│   ├── ui-battle.plist      // 战斗界面专用 UI
│   ├── ui-shop.plist        // 商店界面专用 UI
│   ├── characters.plist     // 角色图片
│   └── effects.plist        // 特效图片
```

**图集大小建议：**

| 平台 | 最大尺寸 | 说明 |
|------|----------|------|
| 高端机 | 4096x4096 | 内存充足 |
| 中端机 | 2048x2048 | 推荐默认值 |
| 低端机 | 1024x1024 | 兼容性最好 |

**合批条件（必须同时满足）：**

1. 使用相同的图集（SpriteAtlas）
2. 使用相同的材质
3. 渲染顺序相邻（中间没有其他材质的节点打断）

**打断合批的常见原因：**

```typescript
// ❌ 错误：不同图集的节点交替排列
Node A (atlas-1) → Draw Call 1
Node B (atlas-2) → Draw Call 2（打断）
Node C (atlas-1) → Draw Call 3（无法与 A 合批）

// ✅ 正确：相同图集的节点放在一起
Node A (atlas-1) → Draw Call 1
Node C (atlas-1) → 与 A 合批
Node B (atlas-2) → Draw Call 2
```

**代码中检查 Draw Call：**

```typescript
// 在调试时查看 Draw Call 数量
update() {
    const drawCalls = director.root?.pipeline?.pipelineSceneData?.drawCalls;
    console.log('Draw Calls:', drawCalls);
}
```

**使用 TexturePacker 等工具：**

1. 自动合并小图为图集
2. 自动裁剪透明边缘（Trim）
3. 支持多种压缩格式导出
4. 生成 Cocos Creator 兼容的 .plist 文件

