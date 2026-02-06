---
title: 避免在 update 中创建临时对象
impact: HIGH
impactDescription: 减少 GC 压力，避免帧率波动
tags: performance, gc, temp-objects, vec3, update
---

## 避免在 update 中创建临时对象

在 `update` 中创建 `Vec2`、`Vec3`、`Color`、`Rect` 等对象会产生大量临时对象，增加 GC 压力。

**错误示例（每帧创建新向量）：**

```typescript
@ccclass('Player')
export class Player extends Component {
    @property
    speed: number = 100;

    update(dt: number) {
        // ❌ 每帧创建新的 Vec3 对象
        this.node.position = new Vec3(
            this.node.position.x + dt * this.speed,
            this.node.position.y,
            0
        );

        // ❌ 每帧创建新的 Color 对象
        this.sprite.color = new Color(255, 0, 0, 255);
    }
}
```

**正确示例（复用临时变量）：**

```typescript
import { _decorator, Component, Vec3, Color, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Player')
export class Player extends Component {
    @property
    speed: number = 100;

    @property(Sprite)
    sprite: Sprite = null!;

    // ✅ 在类级别声明临时变量
    private _tempVec3 = new Vec3();
    private _tempColor = new Color();

    update(dt: number) {
        // ✅ 复用临时变量
        const pos = this.node.position;
        this._tempVec3.set(pos.x + dt * this.speed, pos.y, pos.z);
        this.node.position = this._tempVec3;

        // ✅ 复用 Color 对象
        this._tempColor.set(255, 0, 0, 255);
        this.sprite.color = this._tempColor;
    }
}
```

**更优方案（使用内置方法）：**

```typescript
update(dt: number) {
    // ✅ 使用 setPosition 直接设置，避免创建 Vec3
    const pos = this.node.position;
    this.node.setPosition(pos.x + dt * this.speed, pos.y, pos.z);

    // ✅ 使用 translate 进行相对移动
    this.node.translate(new Vec3(dt * this.speed, 0, 0));
}
```

**需要注意的临时对象类型：**

| 类型 | 创建开销 | 建议 |
|------|----------|------|
| `Vec2` / `Vec3` | 中 | 必须复用 |
| `Color` | 中 | 必须复用 |
| `Rect` | 中 | 必须复用 |
| `Mat4` | 高 | 必须复用 |
| `Quat` | 中 | 必须复用 |
| 数组 `[]` | 低 | 频繁创建时复用 |
| 对象 `{}` | 低 | 频繁创建时复用 |

**全局临时变量池：**

```typescript
// 创建全局临时变量，多个组件共享
export const TempVars = {
    vec3_1: new Vec3(),
    vec3_2: new Vec3(),
    vec2_1: new Vec2(),
    color_1: new Color(),
    mat4_1: new Mat4(),
};

// 使用时
update(dt: number) {
    const temp = TempVars.vec3_1;
    temp.set(1, 2, 3);
    this.node.position = temp;
}
```

**注意：** 全局临时变量在同一帧内可能被多处使用，确保使用后立即应用，不要跨帧持有引用。

