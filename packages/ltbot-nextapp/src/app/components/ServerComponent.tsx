import React from 'react';

// 这是一个服务器组件
// 服务器组件在服务器上渲染，不发送 JavaScript 到客户端
const ServerComponent = async () => {
  // 模拟一些服务器端处理
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const serverTime = new Date().toISOString();
  
  return (
    <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-4">
      <h3 className="text-lg font-bold text-green-800">服务器组件</h3>
      <p className="text-green-700">此组件在服务器上渲染。</p>
      <p className="text-green-700">服务器时间: {serverTime}</p>
      <div className="mt-2 text-sm text-green-600">
        <p className="font-semibold">服务器组件的优势：</p>
        <ul className="list-disc pl-5 mt-1">
          <li>减小捆绑包大小（不向客户端发送 JavaScript）</li>
          <li>直接访问后端资源（数据库、文件系统）</li>
          <li>自动代码分割</li>
          <li>增强安全性（敏感代码保留在服务器上）</li>
        </ul>
      </div>
    </div>
  );
};

export default ServerComponent;