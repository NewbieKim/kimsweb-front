export type KbNodeType = 'dir' | 'file'

export interface KbTreeNode {
  name: string
  title: string
  path: string
  type: KbNodeType
  children?: KbTreeNode[]
}

export interface KbFileData {
  path: string
  content: string
}

export type KbViewMode = 'preview' | 'edit'
