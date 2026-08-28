import express, { Router, Request, Response } from 'express'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DEFAULT_ROOT = path.join(__dirname, '..', 'skillKnowledgeBase') // 默认技能知识库根目录，本地测试时使用
const ROOT = path.resolve(process.env.SKILL_KB_DIR || DEFAULT_ROOT) // 技能知识库根目录

export interface KbTreeNode {
  name: string
  title: string
  path: string
  type: 'dir' | 'file'
  children?: KbTreeNode[]
}

// 确保根目录存在
function ensureRootExists() {
  if (!fsSync.existsSync(ROOT)) {
    fsSync.mkdirSync(ROOT, { recursive: true })
  }
}

/** 将相对路径解析到沙箱内；非法则返回 null */
function resolveSafe(rel: string): string | null {
  if (!rel || typeof rel !== 'string') return null
  const normalized = rel.replace(/\\/g, '/').replace(/^\/+/, '')
  if (!normalized || normalized.includes('\0')) return null
  const absolute = path.resolve(ROOT, normalized)
  const rootWithSep = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep
  if (absolute !== ROOT && !absolute.startsWith(rootWithSep)) {
    return null
  }
  return absolute
}

function toPosixRel(absolute: string): string {
  return path.relative(ROOT, absolute).split(path.sep).join('/')
}

function isHtmlFile(name: string): boolean {
  return name.toLowerCase().endsWith('.html')
}

function displayTitle(fileName: string): string {
  return fileName.replace(/\.html$/i, '')
}

async function buildTree(dirAbs: string): Promise<KbTreeNode[]> {
  const entries = await fs.readdir(dirAbs, { withFileTypes: true }) // 读取目录下的所有文件和目录
  const dirs = entries.filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  const files = entries
    .filter((e) => e.isFile() && isHtmlFile(e.name))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

  const nodes: KbTreeNode[] = []

  for (const d of dirs) {
    const childAbs = path.join(dirAbs, d.name)
    const children = await buildTree(childAbs)
    nodes.push({
      name: d.name,
      title: d.name,
      path: toPosixRel(childAbs),
      type: 'dir',
      children
    })
  }

  for (const f of files) {
    const fileAbs = path.join(dirAbs, f.name)
    nodes.push({
      name: f.name,
      title: displayTitle(f.name),
      path: toPosixRel(fileAbs),
      type: 'file'
    })
  }

  return nodes
}

const router: Router = express.Router()

ensureRootExists()

/** GET /tree — 目录树 */
router.get('/tree', async (_req: Request, res: Response) => {
  try {
    ensureRootExists()
    const data = await buildTree(ROOT)
    res.json({ success: true, data, message: 'ok' })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '读取目录失败',
      error: String(error)
    })
  }
})

/** GET /file?path= — 读取 HTML 源码 */
router.get('/file', async (req: Request, res: Response) => {
  try {
    const rel = String(req.query.path || '')
    const abs = resolveSafe(rel)
    if (!abs) {
      return res.status(400).json({ success: false, message: '非法路径' })
    }
    if (!isHtmlFile(abs)) {
      return res.status(400).json({ success: false, message: '仅支持 HTML 文件' })
    }
    if (!fsSync.existsSync(abs) || !fsSync.statSync(abs).isFile()) {
      return res.status(404).json({ success: false, message: '文件不存在' })
    }
    const content = await fs.readFile(abs, 'utf-8')
    res.json({
      success: true,
      data: { path: toPosixRel(abs), content },
      message: 'ok'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '读取文件失败',
      error: String(error)
    })
  }
})

/** PUT /file — 覆盖写入 HTML */
router.put('/file', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: '在线页面无法编辑'
    })
  }
  try {
    const { path: rel, content } = req.body || {}
    if (typeof rel !== 'string' || typeof content !== 'string') {
      return res.status(400).json({ success: false, message: '缺少 path 或 content' })
    }
    const abs = resolveSafe(rel)
    if (!abs) {
      return res.status(400).json({ success: false, message: '非法路径' })
    }
    if (!isHtmlFile(abs)) {
      return res.status(400).json({ success: false, message: '仅支持 HTML 文件' })
    }
    if (!fsSync.existsSync(abs) || !fsSync.statSync(abs).isFile()) {
      return res.status(404).json({ success: false, message: '文件不存在' })
    }
    await fs.writeFile(abs, content, 'utf-8')
    res.json({
      success: true,
      data: { path: toPosixRel(abs) },
      message: '保存成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '保存失败',
      error: String(error)
    })
  }
})

/**
 * GET /content/* — 静态预览（iframe / 相对资源）
 * 挂在 ROOT 上，浏览器按目录解析相对 CSS/图片
 */
router.use(
  '/content',
  express.static(ROOT, {
    fallthrough: false,
    setHeaders(res) {
      res.setHeader('Cache-Control', 'no-store')
    }
  })
)

export default router
export { ROOT as SKILL_KB_ROOT }
