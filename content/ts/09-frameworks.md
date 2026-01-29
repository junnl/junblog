+++
date = '2026-01-27T10:09:00+08:00'
draft = false
title = '09. Vue/React 实战'
weight = 9
+++

# Vue/React 中的 TypeScript 实战

你已经接触过 Vue 和 React，本章讲解如何在这两个框架中使用 TypeScript。

## Vue 3 + TypeScript

### 项目创建

```bash
npm create vue@latest my-vue-app
# 选择 TypeScript 支持
```

### 组件定义

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// Props 类型定义
interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

// Emits 类型定义
const emit = defineEmits<{
  (e: 'update', value: number): void
  (e: 'delete', id: string): void
}>()

// 响应式数据
const message = ref<string>('Hello')
const items = ref<string[]>([])

// 计算属性
const doubled = computed(() => props.count * 2)

// 方法
function handleClick(): void {
  emit('update', doubled.value)
}
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <p>{{ message }}</p>
    <button @click="handleClick">Click</button>
  </div>
</template>
```

### 组合式函数（Composables）

```typescript
// composables/useCounter.ts
import { ref, computed, type Ref } from 'vue'

interface UseCounterReturn {
  count: Ref<number>
  doubled: Ref<number>
  increment: () => void
  decrement: () => void
}

export function useCounter(initial = 0): UseCounterReturn {
  const count = ref(initial)
  const doubled = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  return { count, doubled, increment, decrement }
}
```

### Pinia Store

```typescript
// stores/user.ts
import { defineStore } from 'pinia'

interface User {
  id: number
  name: string
  email: string
}

interface UserState {
  user: User | null
  loading: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    loading: false
  }),

  getters: {
    isLoggedIn: (state) => state.user !== null,
    userName: (state) => state.user?.name ?? 'Guest'
  },

  actions: {
    async fetchUser(id: number) {
      this.loading = true
      try {
        const res = await fetch(`/api/users/${id}`)
        this.user = await res.json()
      } finally {
        this.loading = false
      }
    }
  }
})
```

## React + TypeScript

### 项目创建

```bash
npm create vite@latest my-react-app -- --template react-ts
```

### 函数组件

```tsx
import { useState, useCallback } from 'react'

// Props 类型
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

// 函数组件
const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  disabled = false,
  variant = 'primary'
}) => {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  )
}

// 带 children 的组件
interface CardProps {
  title: string
  children: React.ReactNode
}

const Card: React.FC<CardProps> = ({ title, children }) => (
  <div className="card">
    <h2>{title}</h2>
    {children}
  </div>
)
```

### Hooks 类型

```tsx
import { useState, useEffect, useRef, useCallback } from 'react'

function UserProfile({ userId }: { userId: number }) {
  // useState
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  // useRef
  const inputRef = useRef<HTMLInputElement>(null)

  // useCallback
  const handleSubmit = useCallback((data: FormData) => {
    // ...
  }, [])

  // useEffect
  useEffect(() => {
    async function fetchUser() {
      setLoading(true)
      const res = await fetch(`/api/users/${userId}`)
      const data: User = await res.json()
      setUser(data)
      setLoading(false)
    }
    fetchUser()
  }, [userId])

  return (/* ... */)
}
```

### 自定义 Hook

```typescript
// hooks/useFetch.ts
import { useState, useEffect } from 'react'

interface UseFetchResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await fetch(url)
        const json = await res.json()
        setData(json)
      } catch (e) {
        setError(e as Error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [url])

  return { data, loading, error }
}

// 使用
const { data, loading } = useFetch<User[]>('/api/users')
```

### 事件处理

```tsx
function Form() {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('clicked')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
      <button onClick={handleClick}>Submit</button>
    </form>
  )
}
```

## 通用最佳实践

### API 类型定义

```typescript
// types/api.ts
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// api/user.ts
export async function getUsers(): Promise<ApiResponse<PaginatedData<User>>> {
  const res = await fetch('/api/users')
  return res.json()
}
```

## 小结

| 框架 | 类型定义方式 | 关键点 |
|------|-------------|--------|
| Vue 3 | `defineProps<T>()` | 泛型定义 Props |
| Vue 3 | `defineEmits<T>()` | 泛型定义 Emits |
| Vue 3 | `ref<T>()` | 泛型响应式 |
| React | `React.FC<Props>` | 函数组件类型 |
| React | `useState<T>()` | 泛型状态 |
| React | `useRef<T>()` | 泛型引用 |

---

下一章：[最佳实践与常见问题](../10-best-practices/) →

