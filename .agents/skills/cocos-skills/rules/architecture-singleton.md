---
title: 单例管理器模式
impact: LOW
impactDescription: 全局状态管理，提高代码可维护性
tags: architecture, singleton, manager, pattern
---

## 单例管理器模式

使用单例模式管理全局状态和服务，确保全局只有一个实例。

**基础单例实现：**

```typescript
// 方式 1：静态实例
export class GameManager {
    private static _instance: GameManager | null = null;

    static get instance(): GameManager {
        if (!this._instance) {
            this._instance = new GameManager();
        }
        return this._instance;
    }

    // 私有构造函数，防止外部 new
    private constructor() {
        this.init();
    }

    private _score = 0;
    private _isPaused = false;

    private init() {
        // 初始化逻辑
    }

    get score() { return this._score; }
    get isPaused() { return this._isPaused; }

    addScore(value: number) {
        this._score += value;
    }

    pause() {
        this._isPaused = true;
        director.pause();
    }

    resume() {
        this._isPaused = false;
        director.resume();
    }

    reset() {
        this._score = 0;
        this._isPaused = false;
    }
}

// 使用
GameManager.instance.addScore(100);
console.log(GameManager.instance.score);
```

**泛型单例基类：**

```typescript
// 单例基类
export class Singleton<T> {
    private static _instances = new Map<Function, any>();

    protected constructor() {}

    static getInstance<T>(this: new () => T): T {
        if (!Singleton._instances.has(this)) {
            Singleton._instances.set(this, new this());
        }
        return Singleton._instances.get(this);
    }

    static destroyInstance<T>(this: new () => T): void {
        Singleton._instances.delete(this);
    }
}

// 继承使用
class AudioManager extends Singleton<AudioManager> {
    private _bgmVolume = 1;
    private _sfxVolume = 1;

    get bgmVolume() { return this._bgmVolume; }
    get sfxVolume() { return this._sfxVolume; }

    setBgmVolume(volume: number) {
        this._bgmVolume = Math.max(0, Math.min(1, volume));
    }

    playBgm(clip: AudioClip) {
        // 播放背景音乐
    }

    playSfx(clip: AudioClip) {
        // 播放音效
    }
}

// 使用
AudioManager.getInstance().playBgm(bgmClip);
```

**组件式单例（挂载到节点）：**

```typescript
import { _decorator, Component, director } from 'cc';
const { ccclass } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    private static _instance: UIManager | null = null;

    static get instance(): UIManager {
        return this._instance!;
    }

    onLoad() {
        if (UIManager._instance) {
            this.destroy();
            return;
        }
        UIManager._instance = this;
        // 跨场景保留
        director.addPersistRootNode(this.node);
    }

    onDestroy() {
        if (UIManager._instance === this) {
            UIManager._instance = null;
        }
    }

    // UI 管理方法
    showPanel(panelName: string) { /* ... */ }
    hidePanel(panelName: string) { /* ... */ }
    showToast(message: string) { /* ... */ }
}
```

**管理器注册表模式：**

```typescript
// 统一管理所有单例
class ManagerRegistry {
    private static _managers = new Map<string, any>();

    static register<T>(name: string, manager: T): void {
        this._managers.set(name, manager);
    }

    static get<T>(name: string): T {
        return this._managers.get(name);
    }

    static destroy(name: string): void {
        const manager = this._managers.get(name);
        if (manager?.destroy) {
            manager.destroy();
        }
        this._managers.delete(name);
    }

    static destroyAll(): void {
        this._managers.forEach((manager, name) => {
            if (manager?.destroy) {
                manager.destroy();
            }
        });
        this._managers.clear();
    }
}

// 注册管理器
ManagerRegistry.register('game', GameManager.instance);
ManagerRegistry.register('audio', AudioManager.getInstance());

// 获取管理器
const gameManager = ManagerRegistry.get<GameManager>('game');
```

**注意事项：**

1. **避免过度使用**：单例会增加代码耦合，只用于真正需要全局访问的服务
2. **注意生命周期**：场景切换时考虑是否需要重置状态
3. **线程安全**：JavaScript 单线程，无需考虑线程安全
4. **测试困难**：单例难以 mock，考虑使用依赖注入替代

