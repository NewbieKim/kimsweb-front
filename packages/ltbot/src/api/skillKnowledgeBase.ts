import type { KbTreeNode, KbFileData } from '@/views/skillKnowledgeBase/types'

const API_BASE = '/api/skillKnowledgeBase'

async function parseJson<T>(res: Response): Promise<T> {
  const json = await res.json()
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `HTTP ${res.status}`)
  }
  return json.data as T
}

/** 获取目录树 */
export async function fetchKbTree(): Promise<KbTreeNode[]> {
  const res = await fetch(`${API_BASE}/tree`, {
    method: 'GET',
    credentials: 'include'
  })
  return parseJson<KbTreeNode[]>(res)
}

/** 读取 HTML 源码 */
export async function fetchKbFile(path: string): Promise<KbFileData> {
  const qs = new URLSearchParams({ path })
  const res = await fetch(`${API_BASE}/file?${qs.toString()}`, {
    method: 'GET',
    credentials: 'include'
  })
  return parseJson<KbFileData>(res)
}

/** 保存 HTML 源码 */
export async function saveKbFile(path: string, content: string): Promise<{ path: string }> {
  const res = await fetch(`${API_BASE}/file`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ path, content })
  })
  return parseJson<{ path: string }>(res)
}

/** iframe / 新标签 / 下载用的静态内容 URL */
export function kbContentUrl(filePath: string, tick?: number): string {
  const encoded = filePath
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/')
  const base = `${API_BASE}/content/${encoded}`
  return tick != null ? `${base}?t=${tick}` : base
}

/** 文件所在目录的静态根（用于编辑态 base href） */
export function kbContentDirUrl(filePath: string): string {
  const parts = filePath.split('/')
  parts.pop()
  const dir = parts.map((seg) => encodeURIComponent(seg)).join('/')
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return dir ? `${origin}${API_BASE}/content/${dir}/` : `${origin}${API_BASE}/content/`
}
