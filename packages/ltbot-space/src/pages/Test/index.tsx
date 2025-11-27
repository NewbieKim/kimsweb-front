import React, { useRef, useState, useEffect } from 'react';

function RefExample() {
  const inputRef = useRef(null);
  const countRef = useRef(0); // 用于存储可变值，不会触发重新渲染
  const [count, setCount] = useState(0);
  const prevCountRef = useRef(); // 存储上一次的值
  
  // 存储上一次的 count 值
  useEffect(() => {
    prevCountRef.current = count;
  });
  
  const focusInput = () => {
    inputRef.current.focus();
    inputRef.current.select();
  };
  
  const incrementRef = () => {
    countRef.current += 1;
    console.log('Ref count:', countRef.current);
  };
  
  const incrementState = () => {
    setCount(prevCount => prevCount + 1);
  };
  
  return (
    <div>
      <input ref={inputRef} type="text" placeholder="Click button to focus" />
      <button onClick={focusInput}>Focus Input</button>
      
      <div>
        <button onClick={incrementRef}>Increment Ref (不会触发渲染)</button>
        <button onClick={incrementState}>Increment State (会触发渲染)</button>
      </div>
      
      <p>Current Count: {count}</p>
      <p>Previous Count: {prevCountRef.current}</p>
      <p>Ref Count (控制台查看): {countRef.current}</p>
    </div>
  );
}
export default RefExample