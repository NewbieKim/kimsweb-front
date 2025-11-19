import { useRef, useState } from 'react'
import CanvasDraw from 'react-canvas-draw'
import './style.css'

function Canvas() {
  const canvasRef = useRef<CanvasDraw>(null)
  const [brushColor, setBrushColor] = useState('#444')
  const [brushRadius, setBrushRadius] = useState(4)
  const [lazyRadius, setLazyRadius] = useState(12)

  const handleClear = () => {
    canvasRef.current?.clear()
  }

  const handleUndo = () => {
    canvasRef.current?.undo()
  }

  const handleSave = () => {
    if (canvasRef.current) {
      const data = canvasRef.current.getSaveData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'canvas-drawing.json'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleExportImage = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current.canvasContainer.children[1] as HTMLCanvasElement
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'canvas-drawing.png'
          a.click()
          URL.revokeObjectURL(url)
        }
      })
    }
  }

  const colors = [
    '#000000', '#444444', '#666666',
    '#FF6B6B', '#4ECDC4', '#45B7D1',
    '#FFA07A', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E2', '#F8B195'
  ]

  return (
    <div className="canvas-container">
      <div className="canvas-card">
        <h2>🎨 Canvas 画板</h2>
        <p className="subtitle">使用 react-canvas-draw 实现的画板功能</p>

        <div className="canvas-wrapper">
          <CanvasDraw
            ref={canvasRef}
            brushColor={brushColor}
            brushRadius={brushRadius}
            lazyRadius={lazyRadius}
            canvasWidth={800}
            canvasHeight={500}
            hideGrid={false}
            gridColor="rgba(150,150,150,0.1)"
            backgroundColor="white"
            style={{
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
            }}
          />
        </div>

        <div className="controls-panel">
          <div className="control-group">
            <label>画笔颜色</label>
            <div className="color-palette">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`color-btn ${brushColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setBrushColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="control-group">
            <label>画笔粗细: {brushRadius}px</label>
            <input
              type="range"
              min="1"
              max="20"
              value={brushRadius}
              onChange={(e) => setBrushRadius(Number(e.target.value))}
              className="slider"
            />
          </div>

          <div className="control-group">
            <label>笔触平滑度: {lazyRadius}</label>
            <input
              type="range"
              min="0"
              max="30"
              value={lazyRadius}
              onChange={(e) => setLazyRadius(Number(e.target.value))}
              className="slider"
            />
          </div>

          <div className="action-buttons">
            <button className="btn btn-undo" onClick={handleUndo}>
              ↶ 撤销
            </button>
            <button className="btn btn-clear" onClick={handleClear}>
              🗑️ 清空
            </button>
            <button className="btn btn-save" onClick={handleSave}>
              💾 保存数据
            </button>
            <button className="btn btn-export" onClick={handleExportImage}>
              📥 导出图片
            </button>
          </div>
        </div>

        <div className="tips">
          <h4>💡 功能说明</h4>
          <ul>
            <li>支持自由绘画</li>
            <li>可调节画笔颜色、粗细和平滑度</li>
            <li>支持撤销操作</li>
            <li>可保存绘画数据为 JSON</li>
            <li>可导出为 PNG 图片</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Canvas

