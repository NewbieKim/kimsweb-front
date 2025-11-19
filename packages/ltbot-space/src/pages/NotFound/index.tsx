import { Link } from 'react-router-dom'
import './style.css'

function NotFound() {
  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <div className="error-code">404</div>
        <h2>页面未找到</h2>
        <p>抱歉，您访问的页面不存在</p>
        <Link to="/" className="back-home-btn">
          返回首页
        </Link>
      </div>
    </div>
  )
}

export default NotFound

