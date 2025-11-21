// 定义 counter 模块的状态和操作
// 状态：value（当前计数）、status（加载状态）
// 操作：increment（增加）、decrement（减少）、incrementByAmount（增加指定值）、reset（重置为0）

import { createSlice, PayloadAction } from '@reduxjs/toolkit'  
// 引入 Redux Toolkit 提供的 createSlice 函数，用于创建 Redux 切片

import type { RootState } from '../index'

interface CounterState {
  value: number
  status: 'idle' | 'loading' | 'failed'
}

const initialState: CounterState = {
  value: 0,
  status: 'idle',
}
// 创建 counter 切片
// 切片名称：counter
// 初始状态：initialState
// 定义操作：increment（增加）、decrement（减少）、incrementByAmount（增加指定值）、reset（重置为0）

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1
    },
    decrement: (state) => {
      state.value -= 1
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload
    },
    reset: (state) => {
      state.value = 0
    },
  },
})

export const { increment, decrement, incrementByAmount, reset } = counterSlice.actions

export const selectCount = (state: RootState) => state.counter.value
export const selectStatus = (state: RootState) => state.counter.status

export default counterSlice.reducer

