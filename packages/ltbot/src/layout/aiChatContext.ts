import type { InjectionKey } from 'vue'

export interface OpenAIChatOptions { draft?: string }
export const openAIChatKey: InjectionKey<(options?: OpenAIChatOptions, trigger?: HTMLElement | null) => void> = Symbol('openAIChat')
