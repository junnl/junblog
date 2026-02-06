# Cocos Creator 3.x 最佳实践

**Version 1.0.0**  
Cocos Creator 3.x 游戏开发指南  
2024

> **Note:**  
> 本文档主要供 AI Agent 和 LLM 在维护、生成或重构 Cocos Creator 项目时参考。
> 开发者也可以直接阅读，但指南内容针对自动化工作流进行了优化。

---

## 摘要

针对 Cocos Creator 3.x 的综合性能优化指南，专为 AI Agent 和 LLM 设计。包含 8 大类别的规则，按影响程度从关键（性能优化、内存管理）到增量（架构模式）排序。每条规则包含详细说明、错误与正确实现的对比示例，以及具体的影响指标。

---

## 目录

1. [性能优化](#1-性能优化) — **CRITICAL**
2. [内存管理](#2-内存管理) — **CRITICAL**
3. [渲染优化](#3-渲染优化) — **HIGH**
4. [资源管理](#4-资源管理) — **HIGH**
5. [脚本最佳实践](#5-脚本最佳实践) — **MEDIUM**
6. [UI 优化](#6-ui-优化) — **MEDIUM**
7. [物理引擎](#7-物理引擎) — **LOW-MEDIUM**
8. [架构模式](#8-架构模式) — **LOW**

---

## 1. 性能优化

**Impact: CRITICAL**

性能优化是游戏流畅运行的基础。避免 GC 抖动、减少 Draw Call、缓存引用是最重要的优化手段。

### 1.1 使用对象池避免频繁 GC

**Impact: CRITICAL (避免 GC 导致的卡顿)**

频繁创建和销毁对象会触发垃圾回收，导致游戏卡顿。使用对象池复用对象。

**错误示例：每次都创建新节点**

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

**正确示例：使用 NodePool**

```typescript
@ccclass('BulletManager')
export class BulletManager extends Component {
    @property(Prefab)
    bulletPrefab: Prefab = null!;

    private _pool: NodePool = new NodePool();

    fire() {
        let bullet = this._pool.get();
        if (!bullet) {
            bullet = instantiate(this.bulletPrefab);
        }
        bullet.parent = this.node;
        // 重置子弹状态
        bullet.getComponent(Bullet)?.reset();
    }

    onBulletHit(bullet: Node) {
        // ✅ 回收到对象池
        this._pool.put(bullet);
    }

    onDestroy() {
        this._pool.clear();
    }
}
```

### 1.2 合批减少 Draw Call

**Impact: CRITICAL (Draw Call 过多是移动端性能杀手)**

每个 Draw Call 都有 CPU 开销。通过合批可以大幅减少 Draw Call 数量。

**合批条件：**
- 使用相同的图集（SpriteAtlas）
- 使用相同的材质
- 渲染顺序相邻（中间没有其他材质的节点打断）

**错误示例：图片分散，无法合批**

```
assets/
├── ui/
│   ├── btn_start.png      # 单独图片
│   ├── btn_setting.png    # 单独图片
│   └── icon_coin.png      # 单独图片
```

**正确示例：打包成图集**

```
assets/
├── ui/
│   ├── ui-atlas.plist     # 图集配置
│   └── ui-atlas.png       # 合并后的图集
```

**代码中检查 Draw Call：**

```typescript
// 在调试时查看 Draw Call 数量
console.log(director.root?.pipeline?.pipelineSceneData?.drawCalls);
```

### 1.3 缓存节点和组件引用

**Impact: HIGH (避免每帧查找开销)**

`getComponent`、`getChildByName`、`find` 等方法有查找开销，应在 `start` 或 `onLoad` 中缓存。

**错误示例：每帧查找组件**

```typescript
@ccclass('Player')
export class Player extends Component {
    update(dt: number) {
        // ❌ 每帧都在查找组件
        const rb = this.getComponent(RigidBody2D);
        const anim = this.getComponent(Animation);
        const label = this.node.getChildByName('ScoreLabel')?.getComponent(Label);

        rb?.applyForce(new Vec2(100, 0), new Vec2(0, 0), true);
    }
}
```

**正确示例：缓存引用**

```typescript
@ccclass('Player')
export class Player extends Component {
    private _rb: RigidBody2D = null!;
    private _anim: Animation = null!;
    private _scoreLabel: Label = null!;

    onLoad() {
        // ✅ 在 onLoad 中缓存引用
        this._rb = this.getComponent(RigidBody2D)!;
        this._anim = this.getComponent(Animation)!;
        this._scoreLabel = this.node.getChildByName('ScoreLabel')?.getComponent(Label)!;
    }

    update(dt: number) {
        // ✅ 直接使用缓存的引用
        this._rb.applyForce(new Vec2(100, 0), new Vec2(0, 0), true);
    }
}
```

### 1.4 避免在 update 中创建临时对象

**Impact: HIGH (减少 GC 压力)**

在 `update` 中创建 `Vec2`、`Vec3`、`Color` 等对象会产生大量临时对象。

**错误示例：每帧创建新向量**

```typescript
update(dt: number) {
    // ❌ 每帧创建新的 Vec3 对象
    this.node.position = new Vec3(
        this.node.position.x + dt * 100,
        this.node.position.y,
        0
    );
}
```

**正确示例：复用临时变量**

```typescript
private _tempVec3 = new Vec3();

update(dt: number) {
    // ✅ 复用临时变量
    const pos = this.node.position;
    this._tempVec3.set(pos.x + dt * 100, pos.y, pos.z);
    this.node.position = this._tempVec3;
}
```

### 1.5 使用调度器替代 update

**Impact: MEDIUM (减少不必要的每帧调用)**

不需要每帧执行的逻辑，使用 `schedule` 或 `scheduleOnce` 替代。

**错误示例：在 update 中做定时检查**

```typescript
private _checkTimer = 0;

update(dt: number) {
    // ❌ 每帧都在执行，但只有每秒才真正做事
    this._checkTimer += dt;
    if (this._checkTimer >= 1) {
        this._checkTimer = 0;
        this.checkEnemyDistance();
    }
}
```

**正确示例：使用调度器**

```typescript
onLoad() {
    // ✅ 每秒执行一次
    this.schedule(this.checkEnemyDistance, 1);
}

checkEnemyDistance() {
    // 检查逻辑
}

onDestroy() {
    this.unschedule(this.checkEnemyDistance);
}
```

---

## 2. 内存管理

**Impact: CRITICAL**

内存管理不当会导致内存泄漏、OOM 崩溃。正确释放资源、避免泄漏是关键。

### 2.1 选择合适的纹理压缩格式

**Impact: CRITICAL (内存占用可降低 75%)**

不同平台使用不同的压缩格式，可大幅减少内存占用。

| 平台 | 推荐格式 | 压缩比 |
|------|----------|--------|
| iOS | ASTC 4x4 / PVRTC | 4:1 ~ 8:1 |
| Android | ETC2 / ASTC | 4:1 ~ 6:1 |
| Web | WebP + 运行时解压 | 视情况 |

**在 Cocos Creator 中配置：**

1. 选中纹理资源
2. 在属性检查器中设置 `压缩纹理` 选项
3. 为不同平台配置不同格式

### 2.2 正确释放不再使用的资源

**Impact: CRITICAL (防止内存持续增长)**

动态加载的资源需要手动释放，否则会一直占用内存。

**错误示例：只加载不释放**

```typescript
async loadLevel(levelId: number) {
    // ❌ 加载新关卡，但没有释放旧关卡资源
    const prefab = await resources.load<Prefab>(`levels/level_${levelId}`);
    const level = instantiate(prefab);
    level.parent = this.node;
}
```

**正确示例：加载前释放旧资源**

```typescript
private _currentLevelPrefab: Prefab | null = null;
private _currentLevel: Node | null = null;

async loadLevel(levelId: number) {
    // ✅ 先释放旧资源
    if (this._currentLevel) {
        this._currentLevel.destroy();
        this._currentLevel = null;
    }
    if (this._currentLevelPrefab) {
        resources.release(this._currentLevelPrefab);
        this._currentLevelPrefab = null;
    }

    // 加载新资源
    this._currentLevelPrefab = await resources.load<Prefab>(`levels/level_${levelId}`);
    this._currentLevel = instantiate(this._currentLevelPrefab);
    this._currentLevel.parent = this.node;
}
```

### 2.3 避免闭包导致的内存泄漏

**Impact: HIGH (常见的内存泄漏原因)**

闭包会持有外部变量的引用，如果闭包被长期持有，会导致内存泄漏。

**错误示例：事件回调持有 this 引用**

```typescript
@ccclass('LeakyComponent')
export class LeakyComponent extends Component {
    onLoad() {
        // ❌ 闭包持有 this，即使组件销毁也不会释放
        director.on(Director.EVENT_AFTER_UPDATE, () => {
            this.doSomething();
        });
    }

    // 没有在 onDestroy 中移除监听
}
```

**正确示例：正确管理事件监听**

```typescript
@ccclass('SafeComponent')
export class SafeComponent extends Component {
    private _onUpdate = () => {
        this.doSomething();
    };

    onLoad() {
        director.on(Director.EVENT_AFTER_UPDATE, this._onUpdate, this);
    }

    onDestroy() {
        // ✅ 移除监听，断开引用
        director.off(Director.EVENT_AFTER_UPDATE, this._onUpdate, this);
    }
}
```

---

## 3. 渲染优化

**Impact: HIGH**

渲染优化直接影响游戏帧率。减少 Draw Call、避免过度绘制是核心。

### 3.1 减少过度绘制

**Impact: HIGH (移动端 GPU 瓶颈)**

过度绘制（Overdraw）指同一像素被多次绘制。透明区域大的图片是主要原因。

**优化策略：**

1. **裁剪透明区域**：使用 TexturePacker 等工具裁剪图片透明边缘
2. **避免大面积半透明**：半透明 UI 会导致下层所有内容重绘
3. **合理设置层级**：减少不必要的节点层叠

**错误示例：大量透明区域**

```
// 一张 512x512 的图片，实际内容只有中间 100x100
// 周围 412x412 的透明区域也会参与渲染计算
```

**正确做法：**

```
// 使用 TexturePacker 的 Trim 功能
// 自动裁剪透明区域，只保留实际内容
```

### 3.2 使用图集减少 Draw Call

**Impact: HIGH (Draw Call 可减少 80%+)**

将多张小图合并成图集，可以大幅减少 Draw Call。

**图集最佳实践：**

```typescript
// 按功能模块划分图集
assets/
├── atlas/
│   ├── ui-common.plist      // 通用 UI 元素
│   ├── ui-battle.plist      // 战斗界面 UI
│   ├── characters.plist     // 角色图片
│   └── effects.plist        // 特效图片
```

**图集大小建议：**
- 移动端：最大 2048x2048
- 低端机：最大 1024x1024
- 尽量填满图集，减少浪费

### 3.3 理解动态合批条件

**Impact: MEDIUM (自动优化的前提)**

Cocos Creator 3.x 支持动态合批，但需要满足条件：

**合批条件：**
1. 使用相同材质实例
2. 使用相同纹理（或同一图集）
3. 渲染顺序相邻
4. 顶点数据格式相同

**打断合批的常见原因：**

```typescript
// ❌ 中间插入了使用不同材质的节点
Node A (材质1) → 可合批
Node B (材质2) → 打断合批
Node C (材质1) → 无法与 A 合批

// ✅ 调整层级，相同材质放一起
Node A (材质1) → 可合批
Node C (材质1) → 与 A 合批
Node B (材质2) → 单独一个 Draw Call
```

### 3.4 实现视锥剔除

**Impact: MEDIUM (大场景必备)**

对于大场景，手动实现视锥剔除可以避免渲染屏幕外的对象。

```typescript
@ccclass('CullingManager')
export class CullingManager extends Component {
    @property([Node])
    cullableNodes: Node[] = [];

    private _camera: Camera = null!;
    private _visibleRect = new Rect();

    onLoad() {
        this._camera = this.getComponent(Camera)!;
    }

    update() {
        this.updateVisibleRect();
        this.cullNodes();
    }

    private updateVisibleRect() {
        const camera = this._camera;
        const visibleSize = view.getVisibleSize();
        const cameraPos = camera.node.worldPosition;

        this._visibleRect.set(
            cameraPos.x - visibleSize.width / 2,
            cameraPos.y - visibleSize.height / 2,
            visibleSize.width,
            visibleSize.height
        );
    }

    private cullNodes() {
        for (const node of this.cullableNodes) {
            const pos = node.worldPosition;
            // 简单的 AABB 检测
            const isVisible = this._visibleRect.contains(new Vec2(pos.x, pos.y));
            node.active = isVisible;
        }
    }
}
```

---

## 4. 资源管理

**Impact: HIGH**

合理的资源管理策略可以优化加载时间和内存占用。

### 4.1 Asset Bundle 分包策略

**Impact: HIGH (首包体积和加载速度)**

使用 Asset Bundle 将资源分包，按需加载。

**分包策略建议：**

```
bundles/
├── main/           # 主包：启动必需资源
├── common/         # 公共包：通用 UI、音效
├── level-1/        # 关卡包：按关卡分包
├── level-2/
└── characters/     # 角色包：角色资源
```

**加载示例：**

```typescript
async loadBundle(bundleName: string): Promise<AssetManager.Bundle> {
    return new Promise((resolve, reject) => {
        assetManager.loadBundle(bundleName, (err, bundle) => {
            if (err) {
                reject(err);
            } else {
                resolve(bundle);
            }
        });
    });
}

async loadLevel(levelId: number) {
    // 加载关卡 Bundle
    const bundle = await this.loadBundle(`level-${levelId}`);

    // 从 Bundle 中加载资源
    const prefab = await new Promise<Prefab>((resolve, reject) => {
        bundle.load('level-prefab', Prefab, (err, asset) => {
            if (err) reject(err);
            else resolve(asset);
        });
    });

    return instantiate(prefab);
}
```

### 4.2 资源预加载最佳实践

**Impact: HIGH (减少加载等待)**

在合适的时机预加载资源，避免使用时才加载。

```typescript
@ccclass('PreloadManager')
export class PreloadManager extends Component {
    // 预加载下一关资源
    async preloadNextLevel(currentLevel: number) {
        const nextLevel = currentLevel + 1;
        const bundleName = `level-${nextLevel}`;

        // 后台预加载，不阻塞当前游戏
        assetManager.loadBundle(bundleName, (err, bundle) => {
            if (!err) {
                // 预加载 Bundle 中的关键资源
                bundle.preloadDir('prefabs');
                bundle.preloadDir('textures');
            }
        });
    }

    // 在 Loading 界面预加载
    async preloadWithProgress(
        bundleName: string,
        onProgress: (progress: number) => void
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err) {
                    reject(err);
                    return;
                }

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
        });
    }
}
```

### 4.3 资源引用计数管理

**Impact: MEDIUM (避免资源泄漏)**

理解 Cocos 的资源引用计数机制，正确管理资源生命周期。

```typescript
// 资源引用计数规则：
// 1. resources.load 加载的资源，引用计数 +1
// 2. instantiate 创建的节点，会增加其依赖资源的引用计数
// 3. 节点 destroy 时，会减少依赖资源的引用计数
// 4. resources.release 会减少引用计数，计数为 0 时真正释放

// 正确的资源管理流程
class ResourceManager {
    private _loadedAssets = new Map<string, Asset>();

    async load<T extends Asset>(path: string, type: Constructor<T>): Promise<T> {
        if (this._loadedAssets.has(path)) {
            return this._loadedAssets.get(path) as T;
        }

        const asset = await new Promise<T>((resolve, reject) => {
            resources.load(path, type, (err, asset) => {
                if (err) reject(err);
                else resolve(asset);
            });
        });

        this._loadedAssets.set(path, asset);
        // 增加引用计数，防止被自动释放
        asset.addRef();
        return asset;
    }

    release(path: string) {
        const asset = this._loadedAssets.get(path);
        if (asset) {
            asset.decRef();
            this._loadedAssets.delete(path);
        }
    }

    releaseAll() {
        this._loadedAssets.forEach((asset) => {
            asset.decRef();
        });
        this._loadedAssets.clear();
    }
}
```

---

## 5. 脚本最佳实践

**Impact: MEDIUM**

遵循 Cocos Creator 3.x 的脚本规范，编写可维护、高性能的代码。

### 5.1 装饰器正确使用

**Impact: MEDIUM (避免序列化问题)**

正确使用装饰器，确保属性正确序列化和显示。

```typescript
import { _decorator, Component, Node, Prefab, SpriteFrame } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('MyComponent')
@executeInEditMode  // 需要在编辑器中执行时添加
export class MyComponent extends Component {
    // 基础类型
    @property
    speed: number = 100;

    // 节点引用
    @property(Node)
    targetNode: Node = null!;

    // 预制体
    @property(Prefab)
    bulletPrefab: Prefab = null!;

    // 数组
    @property([SpriteFrame])
    frames: SpriteFrame[] = [];

    // 私有属性不序列化（不加 @property）
    private _timer: number = 0;

    // 带范围限制的属性
    @property({ type: Number, min: 0, max: 100, step: 1, slide: true })
    health: number = 100;

    // 枚举类型
    @property({ type: Enum(MyEnum) })
    state: MyEnum = MyEnum.Idle;
}
```

### 5.2 生命周期钩子最佳实践

**Impact: MEDIUM (正确的初始化顺序)**

理解并正确使用生命周期钩子。

```typescript
@ccclass('LifecycleDemo')
export class LifecycleDemo extends Component {
    // 执行顺序：onLoad → onEnable → start → update → lateUpdate → onDisable → onDestroy

    onLoad() {
        // ✅ 初始化组件引用、注册全局事件
        // 此时节点已激活，但 start 还未调用
        this._rb = this.getComponent(RigidBody2D)!;
        director.on(Director.EVENT_AFTER_UPDATE, this.onAfterUpdate, this);
    }

    onEnable() {
        // ✅ 注册节点级别的事件
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    }

    start() {
        // ✅ 依赖其他组件初始化完成的逻辑
        // 此时所有组件的 onLoad 都已执行完毕
        this.initializeWithOtherComponents();
    }

    update(dt: number) {
        // ✅ 每帧更新逻辑
    }

    lateUpdate(dt: number) {
        // ✅ 在所有 update 之后执行
        // 适合相机跟随等需要在其他逻辑之后执行的操作
    }

    onDisable() {
        // ✅ 移除节点级别的事件
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    }

    onDestroy() {
        // ✅ 清理全局事件、释放资源
        director.off(Director.EVENT_AFTER_UPDATE, this.onAfterUpdate, this);
    }
}
```

### 5.3 事件管理模式

**Impact: MEDIUM (避免内存泄漏和事件混乱)**

统一的事件管理，确保事件正确注册和移除。

```typescript
// 全局事件管理器
class EventManager {
    private static _instance: EventManager;
    private _eventTarget = new EventTarget();

    static get instance() {
        if (!this._instance) {
            this._instance = new EventManager();
        }
        return this._instance;
    }

    on(event: string, callback: Function, target?: any) {
        this._eventTarget.on(event, callback, target);
    }

    off(event: string, callback: Function, target?: any) {
        this._eventTarget.off(event, callback, target);
    }

    emit(event: string, ...args: any[]) {
        this._eventTarget.emit(event, ...args);
    }

    // 移除某个目标的所有监听
    targetOff(target: any) {
        this._eventTarget.targetOff(target);
    }
}

// 使用示例
@ccclass('EventDemo')
export class EventDemo extends Component {
    onLoad() {
        EventManager.instance.on('game:pause', this.onGamePause, this);
        EventManager.instance.on('player:die', this.onPlayerDie, this);
    }

    onDestroy() {
        // ✅ 一次性移除所有监听
        EventManager.instance.targetOff(this);
    }

    private onGamePause() { /* ... */ }
    private onPlayerDie() { /* ... */ }
}
```

---

## 6. UI 优化

**Impact: MEDIUM**

UI 是游戏中最常见的性能瓶颈之一，特别是复杂列表和频繁更新的元素。

### 6.1 ScrollView 虚拟列表优化

**Impact: HIGH (大列表必备)**

对于长列表，使用虚拟列表只渲染可见项。

```typescript
@ccclass('VirtualList')
export class VirtualList extends Component {
    @property(ScrollView)
    scrollView: ScrollView = null!;

    @property(Prefab)
    itemPrefab: Prefab = null!;

    @property
    itemHeight: number = 100;

    private _data: any[] = [];
    private _itemPool: NodePool = new NodePool();
    private _visibleItems: Map<number, Node> = new Map();
    private _content: Node = null!;

    onLoad() {
        this._content = this.scrollView.content!;
        this.scrollView.node.on('scrolling', this.onScrolling, this);
    }

    setData(data: any[]) {
        this._data = data;
        // 设置内容高度
        const contentHeight = data.length * this.itemHeight;
        this._content.getComponent(UITransform)!.height = contentHeight;
        this.updateVisibleItems();
    }

    private onScrolling() {
        this.updateVisibleItems();
    }

    private updateVisibleItems() {
        const scrollOffset = this.scrollView.getScrollOffset();
        const viewHeight = this.scrollView.node.getComponent(UITransform)!.height;

        // 计算可见范围
        const startIndex = Math.floor(-scrollOffset.y / this.itemHeight);
        const endIndex = Math.ceil((-scrollOffset.y + viewHeight) / this.itemHeight);

        // 回收不可见的项
        this._visibleItems.forEach((item, index) => {
            if (index < startIndex || index > endIndex) {
                this._itemPool.put(item);
                this._visibleItems.delete(index);
            }
        });

        // 创建新的可见项
        for (let i = Math.max(0, startIndex); i <= Math.min(endIndex, this._data.length - 1); i++) {
            if (!this._visibleItems.has(i)) {
                let item = this._itemPool.get();
                if (!item) {
                    item = instantiate(this.itemPrefab);
                }
                item.parent = this._content;
                item.setPosition(0, -i * this.itemHeight - this.itemHeight / 2, 0);

                // 更新数据
                item.getComponent(ListItem)?.setData(this._data[i]);
                this._visibleItems.set(i, item);
            }
        }
    }
}
```

### 6.2 Label 缓存模式选择

**Impact: MEDIUM (文字渲染优化)**

根据使用场景选择合适的 Label 缓存模式。

```typescript
// Label 缓存模式说明：

// NONE - 无缓存
// 适用：文字频繁变化（如计时器、分数）
// 特点：每次都重新渲染，CPU 开销大

// BITMAP - 位图缓存
// 适用：文字不变或很少变化
// 特点：首次渲染后缓存为位图，后续渲染快

// CHAR - 字符缓存
// 适用：使用相同字体的多个 Label
// 特点：字符级别缓存，共享字符纹理

@ccclass('LabelDemo')
export class LabelDemo extends Component {
    @property(Label)
    scoreLabel: Label = null!;  // 频繁变化，用 NONE

    @property(Label)
    titleLabel: Label = null!;  // 不变，用 BITMAP

    onLoad() {
        // 代码设置缓存模式
        this.scoreLabel.cacheMode = Label.CacheMode.NONE;
        this.titleLabel.cacheMode = Label.CacheMode.BITMAP;
    }
}
```

### 6.3 布局组件性能优化

**Impact: MEDIUM (避免频繁重排)**

Layout 组件会在子节点变化时重新计算布局，频繁变化时需要优化。

```typescript
@ccclass('LayoutOptimization')
export class LayoutOptimization extends Component {
    @property(Layout)
    layout: Layout = null!;

    // ❌ 错误：每次添加都触发重排
    addItemsBad(items: Node[]) {
        for (const item of items) {
            item.parent = this.layout.node;
            // 每次 parent 变化都会触发 Layout 重排
        }
    }

    // ✅ 正确：批量添加后手动更新
    addItemsGood(items: Node[]) {
        // 先禁用 Layout
        this.layout.enabled = false;

        for (const item of items) {
            item.parent = this.layout.node;
        }

        // 重新启用并手动更新一次
        this.layout.enabled = true;
        this.layout.updateLayout();
    }
}
```

---

## 7. 物理引擎

**Impact: LOW-MEDIUM**

物理引擎是性能敏感的模块，合理配置可以显著提升性能。

### 7.1 碰撞分组优化

**Impact: MEDIUM (减少碰撞检测次数)**

使用碰撞分组，只检测需要碰撞的对象之间的碰撞。

```typescript
// 在项目设置中配置碰撞矩阵
// 例如：
// - Player 只与 Enemy、Bullet、Wall 碰撞
// - Enemy 只与 Player、Bullet 碰撞
// - Bullet 只与 Player、Enemy、Wall 碰撞

// 代码中设置碰撞分组
@ccclass('CollisionGroupDemo')
export class CollisionGroupDemo extends Component {
    @property(RigidBody2D)
    rigidBody: RigidBody2D = null!;

    onLoad() {
        // 设置碰撞分组
        this.rigidBody.group = PhysicsGroup.PLAYER;
    }
}

// 定义碰撞分组枚举（与项目设置对应）
enum PhysicsGroup {
    DEFAULT = 1 << 0,
    PLAYER = 1 << 1,
    ENEMY = 1 << 2,
    BULLET = 1 << 3,
    WALL = 1 << 4,
}
```

### 7.2 刚体休眠策略

**Impact: MEDIUM (减少物理计算)**

让静止的刚体进入休眠状态，减少物理计算。

```typescript
@ccclass('RigidBodySleep')
export class RigidBodySleep extends Component {
    @property(RigidBody2D)
    rigidBody: RigidBody2D = null!;

    onLoad() {
        // 启用休眠
        this.rigidBody.allowSleep = true;

        // 设置休眠阈值（速度低于此值时进入休眠）
        // 在物理系统设置中配置
    }

    // 需要唤醒时
    wakeUp() {
        this.rigidBody.wakeUp();
    }
}
```

### 7.3 射线检测优化

**Impact: LOW-MEDIUM (避免不必要的检测)**

射线检测是昂贵的操作，需要合理使用。

```typescript
@ccclass('RaycastOptimization')
export class RaycastOptimization extends Component {
    private _raycastInterval = 0.1; // 每 0.1 秒检测一次
    private _timer = 0;

    update(dt: number) {
        this._timer += dt;

        // ❌ 错误：每帧都做射线检测
        // this.doRaycast();

        // ✅ 正确：降低检测频率
        if (this._timer >= this._raycastInterval) {
            this._timer = 0;
            this.doRaycast();
        }
    }

    private doRaycast() {
        const start = this.node.worldPosition;
        const end = new Vec2(start.x + 100, start.y);

        // 使用碰撞分组过滤
        const results = PhysicsSystem2D.instance.raycast(
            start,
            end,
            ERaycast2DType.Closest,
            PhysicsGroup.ENEMY | PhysicsGroup.WALL  // 只检测敌人和墙
        );

        if (results.length > 0) {
            // 处理碰撞结果
        }
    }
}
```

---

## 8. 架构模式

**Impact: LOW**

良好的架构模式提高代码可维护性和可扩展性。

### 8.1 单例管理器模式

**Impact: LOW (全局状态管理)**

使用单例模式管理全局状态和服务。

```typescript
// 基础单例类
export class Singleton<T> {
    private static _instances = new Map<Function, any>();

    static getInstance<T>(this: new () => T): T {
        if (!Singleton._instances.has(this)) {
            Singleton._instances.set(this, new this());
        }
        return Singleton._instances.get(this);
    }
}

// 游戏管理器
class GameManager extends Singleton<GameManager> {
    private _score = 0;
    private _isPaused = false;

    get score() { return this._score; }
    get isPaused() { return this._isPaused; }

    addScore(value: number) {
        this._score += value;
        EventManager.instance.emit('score:changed', this._score);
    }

    pause() {
        this._isPaused = true;
        director.pause();
    }

    resume() {
        this._isPaused = false;
        director.resume();
    }
}

// 使用
GameManager.getInstance().addScore(100);
```

### 8.2 状态机实现

**Impact: LOW (复杂状态管理)**

使用状态机管理复杂的状态转换。

```typescript
// 状态接口
interface IState {
    enter(): void;
    update(dt: number): void;
    exit(): void;
}

// 状态机
class StateMachine {
    private _states = new Map<string, IState>();
    private _currentState: IState | null = null;
    private _currentStateName = '';

    register(name: string, state: IState) {
        this._states.set(name, state);
    }

    change(name: string) {
        if (this._currentStateName === name) return;

        this._currentState?.exit();
        this._currentState = this._states.get(name) || null;
        this._currentStateName = name;
        this._currentState?.enter();
    }

    update(dt: number) {
        this._currentState?.update(dt);
    }
}

// 使用示例：角色状态
@ccclass('PlayerController')
export class PlayerController extends Component {
    private _fsm = new StateMachine();

    onLoad() {
        // 注册状态
        this._fsm.register('idle', {
            enter: () => this.playAnimation('idle'),
            update: () => {},
            exit: () => {},
        });

        this._fsm.register('run', {
            enter: () => this.playAnimation('run'),
            update: (dt) => this.move(dt),
            exit: () => {},
        });

        this._fsm.register('jump', {
            enter: () => {
                this.playAnimation('jump');
                this.doJump();
            },
            update: () => {},
            exit: () => {},
        });

        // 初始状态
        this._fsm.change('idle');
    }

    update(dt: number) {
        this._fsm.update(dt);
    }
}
```

### 8.3 组件通信模式

**Impact: LOW (解耦组件)**

使用事件或接口解耦组件之间的通信。

```typescript
// 方式1：通过事件通信（松耦合）
@ccclass('Player')
export class Player extends Component {
    takeDamage(damage: number) {
        this.hp -= damage;
        // 发送事件，不直接依赖 UI 组件
        EventManager.instance.emit('player:hp-changed', this.hp, this.maxHp);
    }
}

@ccclass('HPBar')
export class HPBar extends Component {
    onLoad() {
        EventManager.instance.on('player:hp-changed', this.updateHP, this);
    }

    onDestroy() {
        EventManager.instance.off('player:hp-changed', this.updateHP, this);
    }

    updateHP(current: number, max: number) {
        this.progressBar.progress = current / max;
    }
}

// 方式2：通过接口通信（类型安全）
interface IDamageable {
    takeDamage(damage: number): void;
}

@ccclass('Bullet')
export class Bullet extends Component {
    onCollision(other: Node) {
        // 通过接口调用，不依赖具体类型
        const damageable = other.getComponent('IDamageable') as IDamageable;
        damageable?.takeDamage(10);
    }
}
```

---

## 参考资料

1. [Cocos Creator 3.x 官方文档](https://docs.cocos.com/creator/3.8/manual/zh/)
2. [Cocos Creator 性能优化指南](https://docs.cocos.com/creator/3.8/manual/zh/advanced-topics/performance-optimization.html)
3. [Cocos Creator 资源管理](https://docs.cocos.com/creator/3.8/manual/zh/asset/asset-manager.html)
4. [Cocos Creator 物理系统](https://docs.cocos.com/creator/3.8/manual/zh/physics-2d/)
```

