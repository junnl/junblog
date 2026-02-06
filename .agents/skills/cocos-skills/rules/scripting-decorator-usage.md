---
title: 装饰器正确使用方式
impact: MEDIUM
impactDescription: 避免序列化问题和编辑器显示异常
tags: scripting, decorator, property, ccclass, typescript
---

## 装饰器正确使用方式

正确使用 Cocos Creator 3.x 的装饰器，确保属性正确序列化和在编辑器中显示。

**基础装饰器使用：**

```typescript
import { 
    _decorator, Component, Node, Prefab, SpriteFrame, 
    Enum, CCInteger, CCFloat, CCString, CCBoolean 
} from 'cc';
const { ccclass, property, executeInEditMode, menu, help } = _decorator;

// 定义枚举
enum PlayerState {
    Idle,
    Run,
    Jump,
    Attack
}

@ccclass('MyComponent')
@executeInEditMode  // 在编辑器中也执行（可选）
@menu('Custom/MyComponent')  // 在组件菜单中的位置
@help('https://docs.example.com/my-component')  // 帮助文档链接
export class MyComponent extends Component {
    
    // ========== 基础类型 ==========
    
    @property
    speed: number = 100;  // 数字，默认显示为输入框

    @property
    playerName: string = 'Player';  // 字符串

    @property
    isActive: boolean = true;  // 布尔值，显示为复选框

    // ========== 明确类型 ==========
    
    @property(CCInteger)
    health: number = 100;  // 整数

    @property(CCFloat)
    attackSpeed: number = 1.5;  // 浮点数

    @property(CCString)
    description: string = '';  // 字符串

    @property(CCBoolean)
    canFly: boolean = false;  // 布尔值

    // ========== 引用类型 ==========
    
    @property(Node)
    targetNode: Node = null!;  // 节点引用

    @property(Prefab)
    bulletPrefab: Prefab = null!;  // 预制体

    @property(SpriteFrame)
    icon: SpriteFrame = null!;  // 精灵帧

    // ========== 数组类型 ==========
    
    @property([Node])
    waypoints: Node[] = [];  // 节点数组

    @property([SpriteFrame])
    frames: SpriteFrame[] = [];  // 精灵帧数组

    @property([CCInteger])
    scores: number[] = [];  // 整数数组

    // ========== 枚举类型 ==========
    
    @property({ type: Enum(PlayerState) })
    state: PlayerState = PlayerState.Idle;

    // ========== 带选项的属性 ==========
    
    @property({
        type: CCFloat,
        min: 0,
        max: 100,
        step: 0.1,
        slide: true,  // 显示为滑动条
        tooltip: '玩家移动速度'
    })
    moveSpeed: number = 50;

    @property({
        type: CCInteger,
        range: [0, 10, 1],  // [min, max, step]
        displayName: '生命数量',
        tooltip: '玩家初始生命数'
    })
    lives: number = 3;

    @property({
        visible: false  // 序列化但不在编辑器显示
    })
    internalData: string = '';

    @property({
        serializable: false  // 不序列化，仅运行时使用
    })
    runtimeCache: any = null;

    @property({
        readonly: true,  // 只读，不可编辑
        displayName: 'Version'
    })
    version: string = '1.0.0';

    // ========== 分组显示 ==========
    
    @property({
        group: { name: 'Movement', displayOrder: 1 },
        type: CCFloat
    })
    walkSpeed: number = 5;

    @property({
        group: { name: 'Movement', displayOrder: 2 },
        type: CCFloat
    })
    runSpeed: number = 10;

    @property({
        group: { name: 'Combat', displayOrder: 1 },
        type: CCInteger
    })
    damage: number = 10;
}
```

**常见错误：**

```typescript
// ❌ 错误：数组类型写法错误
@property(Node[])  // 错误！
nodes: Node[] = [];

// ✅ 正确：数组类型用方括号包裹
@property([Node])
nodes: Node[] = [];

// ❌ 错误：枚举类型直接使用
@property(PlayerState)  // 错误！
state: PlayerState = PlayerState.Idle;

// ✅ 正确：枚举需要用 Enum() 包裹
@property({ type: Enum(PlayerState) })
state: PlayerState = PlayerState.Idle;

// ❌ 错误：私有属性加了 @property 但期望不序列化
@property
private _cache: any = null;  // 会被序列化！

// ✅ 正确：不需要序列化的属性不加 @property
private _cache: any = null;
```

