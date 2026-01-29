+++
date = '2026-01-27T10:06:00+08:00'
draft = false
title = '06. 类与面向对象'
weight = 6
+++

# 类与面向对象

TypeScript 的类语法与 Java/C# 非常相似，你会感到很熟悉。

## 基本类定义

```typescript
class User {
  // 属性声明
  id: number;
  name: string;
  
  // 构造函数
  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }
  
  // 方法
  greet(): string {
    return `Hello, I'm ${this.name}`;
  }
}

const user = new User(1, "张三");
console.log(user.greet()); // "Hello, I'm 张三"
```

## 访问修饰符

```typescript
class Employee {
  public name: string;      // 公开（默认）
  private salary: number;   // 私有，只能在类内部访问
  protected dept: string;   // 受保护，子类可访问
  readonly id: number;      // 只读，初始化后不能修改

  constructor(id: number, name: string, salary: number, dept: string) {
    this.id = id;
    this.name = name;
    this.salary = salary;
    this.dept = dept;
  }

  // 私有方法
  private calculateBonus(): number {
    return this.salary * 0.1;
  }

  // 公开方法访问私有属性
  public getAnnualSalary(): number {
    return this.salary * 12 + this.calculateBonus();
  }
}

const emp = new Employee(1, "张三", 10000, "技术部");
console.log(emp.name);     // ✅ 公开属性
// console.log(emp.salary); // ❌ 私有属性不能访问
// emp.id = 2;              // ❌ 只读属性不能修改
```

## 参数属性简写

TypeScript 特有的简洁语法：

```typescript
// 传统写法
class User {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

// 简写：在构造函数参数前加修饰符
class User {
  constructor(
    public name: string,
    private age: number,
    readonly id: number
  ) {}
}

// 等价于上面的传统写法，但更简洁
```

## 继承

```typescript
class Animal {
  constructor(public name: string) {}
  
  move(distance: number): void {
    console.log(`${this.name} moved ${distance}m`);
  }
}

class Dog extends Animal {
  constructor(name: string, public breed: string) {
    super(name); // 调用父类构造函数
  }
  
  // 重写父类方法
  move(distance: number): void {
    console.log("🐕 Running...");
    super.move(distance); // 调用父类方法
  }
  
  // 子类特有方法
  bark(): void {
    console.log("汪汪汪！");
  }
}

const dog = new Dog("旺财", "柴犬");
dog.move(10);  // "🐕 Running..." "旺财 moved 10m"
dog.bark();    // "汪汪汪！"
```

## 抽象类

不能被实例化，只能被继承：

```typescript
abstract class Shape {
  constructor(public color: string) {}
  
  // 抽象方法：子类必须实现
  abstract getArea(): number;
  
  // 普通方法：子类可以继承
  describe(): string {
    return `A ${this.color} shape with area ${this.getArea()}`;
  }
}

class Circle extends Shape {
  constructor(color: string, public radius: number) {
    super(color);
  }
  
  // 实现抽象方法
  getArea(): number {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle extends Shape {
  constructor(color: string, public width: number, public height: number) {
    super(color);
  }
  
  getArea(): number {
    return this.width * this.height;
  }
}

// const shape = new Shape("red"); // ❌ 不能实例化抽象类
const circle = new Circle("red", 5);
console.log(circle.describe()); // "A red shape with area 78.54..."
```

## 接口实现

```typescript
interface Printable {
  print(): void;
}

interface Serializable {
  serialize(): string;
}

// 实现多个接口
class Document implements Printable, Serializable {
  constructor(public content: string) {}
  
  print(): void {
    console.log(this.content);
  }
  
  serialize(): string {
    return JSON.stringify({ content: this.content });
  }
}
```

## Getter 和 Setter

```typescript
class Person {
  private _age: number = 0;
  
  get age(): number {
    return this._age;
  }
  
  set age(value: number) {
    if (value < 0 || value > 150) {
      throw new Error("Invalid age");
    }
    this._age = value;
  }
}

const person = new Person();
person.age = 25;        // 调用 setter
console.log(person.age); // 调用 getter，输出 25
// person.age = -1;     // 抛出错误
```

## 静态成员

```typescript
class MathUtils {
  static PI = 3.14159;
  
  static add(a: number, b: number): number {
    return a + b;
  }
  
  static {
    // 静态初始化块（ES2022+）
    console.log("MathUtils loaded");
  }
}

console.log(MathUtils.PI);        // 3.14159
console.log(MathUtils.add(1, 2)); // 3
```

## 与 Java/C# 对比

| 特性 | TypeScript | Java | C# |
|------|------------|------|-----|
| 访问修饰符 | `public/private/protected` | 相同 | 相同 |
| 只读属性 | `readonly` | `final` | `readonly` |
| 抽象类 | `abstract class` | 相同 | 相同 |
| 接口实现 | `implements` | 相同 | `:` |
| 参数属性 | ✅ 支持 | ❌ | ❌ |
| 多继承 | ❌ 单继承 | 相同 | 相同 |

## 小结

| 概念 | 语法 | 说明 |
|------|------|------|
| `public` | 默认 | 公开访问 |
| `private` | `private x` | 类内部访问 |
| `protected` | `protected x` | 子类可访问 |
| `readonly` | `readonly x` | 只读 |
| `extends` | `class B extends A` | 继承 |
| `abstract` | `abstract class` | 抽象类 |
| `implements` | `class A implements I` | 实现接口 |

---

下一章：[高级类型](../07-advanced-types/) →

