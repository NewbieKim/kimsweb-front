import { configureStore } from '@reduxjs/toolkit' // 配置 Redux 存储
import counterReducer from './slices/counterSlice' // 引入 counterSlice 中定义的操作和选择器
import userReducer from './slices/userSlice' // 引入 userSlice 中定义的操作和选择器

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
  },
  // 配置 Redux 中间件
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // 禁用序列化检查
    }),
})

export type RootState = ReturnType<typeof store.getState> // 定义 RootState 类型，用于获取 store 的状态
export type AppDispatch = typeof store.dispatch // 定义 AppDispatch 类型，用于获取 store 的调度函数

