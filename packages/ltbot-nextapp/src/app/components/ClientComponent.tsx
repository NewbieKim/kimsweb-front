'use client';

import React, { useState, useEffect } from 'react';

// 这是一个客户端组件
// 客户端组件在浏览器中渲染，支持交互和状态管理
const ClientComponent = () => {
  const [clientTime, setClientTime] = useState('');
  const [count, setCount] = useState(0);

  useEffect(() => {
    // 在客户端生成时间戳
    setClientTime(new Date().toISOString());
    
    // 每秒更新时间戳
    const timer = setInterval(() => {
      setClientTime(new Date().toISOString());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-purple-100 border-l-4 border-purple-500 p-4 mb-4">
      <h3 className="text-lg font-bold text-purple-800">客户端组件</h3>
      <p className="text-purple-700">此组件在客户端渲染。</p>
      <p className="text-purple-700">客户端时间: {clientTime}</p>
      <p className="text-purple-700">计数: {count}</p>
      <button 
        onClick={() => setCount(c => c + 1)}
        className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        增加计数
      </button>
      <div className="mt-2 text-sm text-purple-600">
        <p className="font-semibold">客户端组件的优势：</p>
        <ul className="list-disc pl-5 mt-1">
          <li>交互式 UI 元素（按钮、表单等）</li>
          <li>使用 React hooks 进行状态管理</li>
          <li>事件处理器和效果</li>
          <li>实时更新</li>
        </ul>
      </div>
    </div>
  );
};

export default ClientComponent;