import { useState } from 'react'
// 引入 Redux Toolkit 提供的 useAppDispatch 和 useAppSelector 钩子
// useAppDispatch 用于获取 Redux 调度函数，用于触发状态更新
// useAppSelector 用于从 Redux 状态树中选择状态值

// 引入 counterSlice 中定义的操作和选择器
// 操作：increment（增加）、decrement（减少）、incrementByAmount（增加指定值）、reset（重置为0）
// 选择器：selectCount（获取当前计数）

import { useAppDispatch, useAppSelector } from '../../store/hooks' // 引入 useAppDispatch 和 useAppSelector 钩子
import {
  increment,
  decrement,
  incrementByAmount,
  reset,
  selectCount,
} from '../../store/slices/counterSlice' // 引入 counterSlice 中定义的操作和选择器
import './style.css'

function Counter() {
  const count = useAppSelector(selectCount) // 获取当前计数
  const dispatch = useAppDispatch() // 获取 Redux 调度函数
  const [incrementAmount, setIncrementAmount] = useState('2') // 自定义增量值


  const incrementValue = Number(incrementAmount) || 0

  return (
    <div className="counter-container">
      <div className="counter-card">
        <h2>🔢 Redux Counter Demo</h2>
        <p className="subtitle">演示 Redux Toolkit 状态管理</p>

        <div className="counter-display">
          <div className="count-value">{count}</div>
          <p className="count-label">当前计数</p>
        </div>

        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={() => dispatch(increment())}
          >
            ➕ 加 1
          </button>
          <button
            className="btn btn-danger"
            onClick={() => dispatch(decrement())}
          >
            ➖ 减 1
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => dispatch(reset())}
          >
            🔄 重置
          </button>
        </div>

        <div className="custom-increment">
          <h3>自定义增量</h3>
          <div className="input-row">
            <input
              type="number"
              value={incrementAmount}
              onChange={(e) => setIncrementAmount(e.target.value)}
              placeholder="输入数字"
            />
            <button
              className="btn btn-success"
              onClick={() => dispatch(incrementByAmount(incrementValue))}
            >
              增加 {incrementValue}
            </button>
          </div>
        </div>

        <div className="info-box">
          <h4>💡 技术说明</h4>
          <ul>
            <li>使用 <code>@reduxjs/toolkit</code> 创建 slice</li>
            <li>使用 <code>useAppDispatch</code> 和 <code>useAppSelector</code> hooks</li>
            <li>演示同步 action 的使用</li>
            <li>展示不可变数据更新模式</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Counter

