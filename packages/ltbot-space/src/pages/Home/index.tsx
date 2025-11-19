import { useState, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { setUser, selectCurrentUser, selectIsLoggedIn } from '../../store/slices/userSlice'
import './style.css'

function Home() {
  const [name, setName] = useState('')
  const currentUser = useAppSelector(selectCurrentUser)
  const isLoggedIn = useAppSelector(selectIsLoggedIn)
  const dispatch = useAppDispatch()

  useEffect(() => {
    console.log('Home组件已挂载')
    return () => {
      console.log('Home组件已卸载')
    }
  }, [])

  const handleLogin = () => {
    if (name.trim()) {
      dispatch(setUser({
        id: Date.now().toString(),
        name: name,
        email: `${name}@example.com`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
      }))
      setName('')
    }
  }

  return (
    <div className="home-container">
      <div className="welcome-card">
        <div className="card-header">
          <h2>🎉 欢迎来到 React 练手项目</h2>
          <p>这是一个完整的 React 全家桶示例项目</p>
        </div>

        <div className="card-body">
          {isLoggedIn && currentUser ? (
            <div className="user-info">
              <img src={currentUser.avatar} alt="avatar" className="avatar" />
              <div className="user-details">
                <h3>欢迎回来，{currentUser.name}！</h3>
                <p>{currentUser.email}</p>
              </div>
            </div>
          ) : (
            <div className="login-form">
              <h3>请输入您的名字</h3>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="输入名字..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button onClick={handleLogin}>登录</button>
              </div>
            </div>
          )}
        </div>

        <div className="features">
          <h3>✨ 技术栈</h3>
          <div className="feature-grid">
            <div className="feature-item">
              <span className="icon">⚛️</span>
              <h4>React 18</h4>
              <p>最新版本的React</p>
            </div>
            <div className="feature-item">
              <span className="icon">🔄</span>
              <h4>Redux Toolkit</h4>
              <p>状态管理</p>
            </div>
            <div className="feature-item">
              <span className="icon">🛣️</span>
              <h4>React Router</h4>
              <p>路由管理</p>
            </div>
            <div className="feature-item">
              <span className="icon">🎨</span>
              <h4>Canvas Draw</h4>
              <p>画板功能</p>
            </div>
            <div className="feature-item">
              <span className="icon">📘</span>
              <h4>TypeScript</h4>
              <p>类型安全</p>
            </div>
            <div className="feature-item">
              <span className="icon">⚡</span>
              <h4>Vite</h4>
              <p>快速构建</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

