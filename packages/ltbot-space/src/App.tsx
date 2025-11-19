import { Outlet, Link } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <div className="app-container">
      {/* 导航栏 */}
      <nav className="navbar">
        <div className="nav-brand">
          <h1>🚀 LtBot Space</h1>
          <p>React Practice Project</p>
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/">首页</Link>
          </li>
          <li>
            <Link to="/counter">计数器</Link>
          </li>
          <li>
            <Link to="/canvas">画板</Link>
          </li>
        </ul>
      </nav>

      {/* 主内容区域 */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* 页脚 */}
      <footer className="footer">
        <p>
          © 2024 LtBot Space - 使用 React + Redux + TypeScript + Vite 构建
        </p>
      </footer>
    </div>
  )
}

export default App

