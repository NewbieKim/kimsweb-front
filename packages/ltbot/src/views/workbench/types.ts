export interface WorkbenchHero {
  eyebrow: string
  title: string
  subtitle: string
  command: string
  tabs: string[]
  quickPrompts: string[]
}

export type TodoPriority = 'high' | 'medium' | 'low'

export interface WorkbenchTodo {
  title: string
  description: string
  priority: TodoPriority
  priorityText: string
}

export interface WorkbenchWorkflow {
  icon: string
  title: string
  description: string
  tag: string
}

export interface WorkbenchTool {
  name: string
  type: string
  description: string
  actions: string[]
}

export interface WorkbenchNews {
  title: string
  description: string
  category: string
  time: string
}

export interface WorkbenchProjectLink {
  label: string
  url: string
}

export interface WorkbenchProject {
  title: string
  iconText: string
  introduce: string
  links: WorkbenchProjectLink[]
}

export type WorkbenchResourceVariant = 'hot-tools' | 'hot-tutorials'

export interface WorkbenchResource {
  name: string
  introduce: string
  url?: string
  image?: string
  iconText: string
}
