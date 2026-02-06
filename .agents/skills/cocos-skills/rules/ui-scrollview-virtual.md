---
title: ScrollView 虚拟列表优化
impact: HIGH
impactDescription: 大列表性能提升 10 倍以上，内存占用降低 90%
tags: ui, scrollview, virtual-list, performance
---

## ScrollView 虚拟列表优化

对于长列表（如排行榜、背包），使用虚拟列表只渲染可见项，避免创建大量节点。

**问题：** 1000 条数据的列表，如果全部创建节点，会导致：
- 内存占用过高
- 初始化时间长
- 滚动卡顿

**解决方案：** 只创建可见区域的节点，滚动时复用节点。

**虚拟列表实现：**

```typescript
import { _decorator, Component, ScrollView, Prefab, Node, instantiate, 
         NodePool, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('VirtualList')
export class VirtualList extends Component {
    @property(ScrollView)
    scrollView: ScrollView = null!;

    @property(Prefab)
    itemPrefab: Prefab = null!;

    @property
    itemHeight: number = 100;

    @property
    bufferCount: number = 2; // 上下缓冲数量

    private _data: any[] = [];
    private _itemPool: NodePool = new NodePool();
    private _visibleItems: Map<number, Node> = new Map();
    private _content: Node = null!;
    private _viewHeight: number = 0;

    onLoad() {
        this._content = this.scrollView.content!;
        this._viewHeight = this.scrollView.node.getComponent(UITransform)!.height;
        
        // 监听滚动事件
        this.scrollView.node.on('scrolling', this.onScrolling, this);
    }

    /**
     * 设置列表数据
     */
    setData(data: any[]) {
        this._data = data;
        
        // 设置内容区域高度
        const contentHeight = data.length * this.itemHeight;
        this._content.getComponent(UITransform)!.height = contentHeight;
        
        // 重置滚动位置
        this.scrollView.scrollToTop();
        
        // 更新可见项
        this.updateVisibleItems();
    }

    private onScrolling() {
        this.updateVisibleItems();
    }

    private updateVisibleItems() {
        const scrollOffset = this.scrollView.getScrollOffset();
        
        // 计算可见范围（加上缓冲区）
        const startY = -scrollOffset.y - this.bufferCount * this.itemHeight;
        const endY = -scrollOffset.y + this._viewHeight + this.bufferCount * this.itemHeight;
        
        const startIndex = Math.max(0, Math.floor(startY / this.itemHeight));
        const endIndex = Math.min(
            this._data.length - 1,
            Math.ceil(endY / this.itemHeight)
        );

        // 回收不可见的项
        this._visibleItems.forEach((item, index) => {
            if (index < startIndex || index > endIndex) {
                this._itemPool.put(item);
                this._visibleItems.delete(index);
            }
        });

        // 创建/更新可见项
        for (let i = startIndex; i <= endIndex; i++) {
            if (!this._visibleItems.has(i)) {
                const item = this.getOrCreateItem();
                this.updateItemPosition(item, i);
                this.updateItemData(item, i);
                this._visibleItems.set(i, item);
            }
        }
    }

    private getOrCreateItem(): Node {
        let item = this._itemPool.get();
        if (!item) {
            item = instantiate(this.itemPrefab);
        }
        item.parent = this._content;
        return item;
    }

    private updateItemPosition(item: Node, index: number) {
        // 从顶部开始排列
        const y = -index * this.itemHeight - this.itemHeight / 2;
        item.setPosition(0, y, 0);
    }

    private updateItemData(item: Node, index: number) {
        // 更新 item 显示的数据
        const itemComponent = item.getComponent('ListItem');
        itemComponent?.setData(this._data[index], index);
    }

    /**
     * 刷新指定索引的项
     */
    refreshItem(index: number) {
        const item = this._visibleItems.get(index);
        if (item) {
            this.updateItemData(item, index);
        }
    }

    /**
     * 滚动到指定索引
     */
    scrollToIndex(index: number, duration: number = 0.3) {
        const y = index * this.itemHeight;
        this.scrollView.scrollToOffset(new Vec2(0, y), duration);
    }

    onDestroy() {
        this._itemPool.clear();
    }
}
```

**使用示例：**

```typescript
// 设置数据
const rankData = Array.from({ length: 1000 }, (_, i) => ({
    rank: i + 1,
    name: `Player ${i + 1}`,
    score: Math.floor(Math.random() * 10000)
}));

virtualList.setData(rankData);
```

