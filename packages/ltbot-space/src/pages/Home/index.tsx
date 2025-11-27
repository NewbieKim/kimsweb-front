import React, { useState, useEffect, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { setUser, selectCurrentUser, selectIsLoggedIn } from '../../store/slices/userSlice'
import './style.css'
import Form from '../../components/Form'
import FormItem from '../../components/Form/FormItem'
import Input from '../../components/Form/Input'

// function Home() {
//   const [name, setName] = useState('')
//   const currentUser = useAppSelector(selectCurrentUser)
//   const isLoggedIn = useAppSelector(selectIsLoggedIn)
//   const dispatch = useAppDispatch()
//   const form = useRef(null)
//   const submit = () => {
//     form.current.submitForm((value) => {
//         console.log('vvvvvvvvvv', value)
//     })
//   }
//   const reset = () => {
//     form.current.resetForm()
//   }

//   useEffect(() => {
//     console.log('Home组件已挂载')
//     return () => {
//       console.log('Home组件已卸载')
//     }
//   }, [])

//   const handleLogin = () => {
//     if (name.trim()) {
//       dispatch(setUser({
//         id: Date.now().toString(),
//         name: name,
//         email: `${name}@example.com`,
//         avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
//       }))
//       setName('')
//     }
//   }

//   return (
//     <div className="home-container">
//       <div className="welcome-card">
//         <div className="card-header">
//           <span>123</span>
//         </div>
//       </div>
//     </div>
//   )

//   // return (
//   //   <div className="home-container">
//   //     <div className="welcome-card">
//   //       <div className="card-header">
//   //         <h2>🎉 欢迎来到 React 练手项目</h2>
//   //         <p>这是一个完整的 React 全家桶示例项目</p>
//   //       </div>

//   //       <div className="card-body">
//   //         {isLoggedIn && currentUser ? (
//   //           <div className="user-info">
//   //             <img src={currentUser.avatar} alt="avatar" className="avatar" />
//   //             <div className="user-details">
//   //               <h3>欢迎回来，{currentUser.name}！</h3>
//   //               <p>{currentUser.email}</p>
//   //             </div>
//   //           </div>
//   //         ) : (
//   //           <div className="login-form">
//   //             <h3>请输入您的名字</h3>
//   //             <div className="input-group">
//   //               <input
//   //                 type="text"
//   //                 placeholder="输入名字..."
//   //                 value={name}
//   //                 onChange={(e) => setName(e.target.value)}
//   //                 onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
//   //               />
//   //               <button onClick={handleLogin}>登录</button>
//   //             </div>
//   //           </div>
//   //         )}
//   //       </div>

//   //       <div className="login-form">
//   //         <Form ref={form as React.RefObject<Form>} >
//   //             <FormItem name="name" label="我是">
//   //               <Input />
//   //             </FormItem>
//   //             <FormItem name="age" label="年龄">
//   //               <Input />
//   //             </FormItem>
//   //         </Form>
//   //         <div className="btns" >
//   //             <button className="searchbtn"  onClick={ submit } >提交</button>
//   //             <button className="concellbtn" onClick={ reset } >重置</button>
//   //         </div>
//   //       </div>

//   //       <div className="features">
//   //         <h3>✨ 技术栈</h3>
//   //         <div className="feature-grid">
//   //           <div className="feature-item">
//   //             <span className="icon">⚛️</span>
//   //             <h4>React 18</h4>
//   //             <p>最新版本的React</p>
//   //           </div>
//   //           <div className="feature-item">
//   //             <span className="icon">🔄</span>
//   //             <h4>Redux Toolkit</h4>
//   //             <p>状态管理</p>
//   //           </div>
//   //           <div className="feature-item">
//   //             <span className="icon">🛣️</span>
//   //             <h4>React Router</h4>
//   //             <p>路由管理</p>
//   //           </div>
//   //           <div className="feature-item">
//   //             <span className="icon">🎨</span>
//   //             <h4>Canvas Draw</h4>
//   //             <p>画板功能</p>
//   //           </div>
//   //           <div className="feature-item">
//   //             <span className="icon">📘</span>
//   //             <h4>TypeScript</h4>
//   //             <p>类型安全</p>
//   //           </div>
//   //           <div className="feature-item">
//   //             <span className="icon">⚡</span>
//   //             <h4>Vite</h4>
//   //             <p>快速构建</p>
//   //           </div>
//   //         </div>
//   //       </div>
//   //     </div>
//   //   </div>
//   // )
// }

interface Agency {
  id: number
  title: string
  description: string
  status: 'pending' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
}

// 代办列表页面组件
function Home() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agencies, setAgencies] = useState<Agency[]>([])  // ← 使用 state 管理数据

  useEffect(() => {
    async function fetchAgencies() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('http://ltbot.top/api/agencies')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setAgencies(data.data || [])  // ← 使用 setState 更新数据
        console.log('agencies', data.data)
      } catch (error) {
        console.error('获取代办列表失败:', error)
        // Mock 数据作为降级方案
        setAgencies([
          {
            id: 1,
            title: '代办1',
            description: '代办1描述',
            status: 'pending',
            priority: 'medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 2,
            title: '代办2',
            description: '代办2描述',
            status: 'completed',
            priority: 'high',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ])
        setError(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchAgencies()
  }, [])

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <div className="agencies-container">
      <h3>代办列表</h3>
      <div className="agencies-list">
        {agencies.length > 0 ? (
          agencies.map((agency) => (
            <div key={agency.id} className="agency-item">
              {agency.id} - {agency.title} ({agency.status})
            </div>
          ))
        ) : (
          <div>暂无代办事项</div>
        )}
      </div>
    </div>
  )
}

export default Home

