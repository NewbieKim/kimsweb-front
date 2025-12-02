<template>
  <div class="editor-container">
    <!-- 顶部操作栏 -->
    <div class="editor-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 0 0 0 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z" fill="currentColor"/>
          </svg>
          返回
        </button>
        <input 
          v-model="articleTitle" 
          class="title-input" 
          type="text" 
          placeholder="请输入文章标题..."
        />
      </div>
      <div class="header-right">
        <button class="btn-secondary" @click="saveDraft">
          <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path d="M893.3 293.3L730.7 130.7c-7.5-7.5-16.7-13-26.7-16V112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V338.5c0-17-6.7-33.2-18.7-45.2zM384 184h256v104H384V184zm456 656H184V184h136v136c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V205.8l136 136V840z" fill="currentColor"/>
          </svg>
          暂存草稿
        </button>
        <button class="btn-primary" @click="publishArticle">
          <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zM513.1 518.1l-192 161c-5.2 4.4-13.1.7-13.1-6.1v-62.7c0-2.3 1.1-4.6 2.9-6.1L420.7 512l-109.8-92.2a7.63 7.63 0 0 1-2.9-6.1V351c0-6.8 7.9-10.5 13.1-6.1l192 160.9c3.9 3.2 3.9 9.1 0 12.3zM716 673c0 4.4-3.4 8-7.5 8h-185c-4.1 0-7.5-3.6-7.5-8v-48c0-4.4 3.4-8 7.5-8h185c4.1 0 7.5 3.6 7.5 8v48z" fill="currentColor"/>
          </svg>
          发布文章
        </button>
      </div>
    </div>

    <!-- Markdown编辑器 -->
    <div class="editor-content">
      <MdEditor 
        v-model="content" 
        :show-code-row-number="true"
        :tab-width="2"
        :toolbars="toolbars"
        :def-toolbars="defToolbars"
        placeholder="开始写作..."
        @on-save="saveDraft"
      />
    </div>

    <!-- 分类和标签弹窗 -->
    <div v-if="showPublishDialog" class="dialog-overlay" @click="showPublishDialog = false">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">发布文章</h3>
          <button class="dialog-close" @click="showPublishDialog = false">
            <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
              <path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 0 0 203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        
        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">文章分类</label>
            <select v-model="articleForm.category" class="form-select">
              <option value="">请选择分类</option>
              <option value="前端">前端</option>
              <option value="后端">后端</option>
              <option value="架构">架构</option>
              <option value="运维">运维</option>
              <option value="AI">AI</option>
              <option value="其他">其他</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">文章标签（最多3个）</label>
            <div class="tag-selector">
              <label 
                v-for="tag in availableTags" 
                :key="tag"
                class="tag-checkbox"
                :class="{ 'disabled': articleForm.tags.length >= 3 && !articleForm.tags.includes(tag) }"
              >
                <input 
                  type="checkbox" 
                  :value="tag"
                  v-model="articleForm.tags"
                  :disabled="articleForm.tags.length >= 3 && !articleForm.tags.includes(tag)"
                />
                <span>{{ tag }}</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">封面图片</label>
            <input 
              v-model="articleForm.image" 
              type="text" 
              class="form-input" 
              placeholder="请输入封面图片URL"
            />
          </div>
        </div>
        
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showPublishDialog = false">取消</button>
          <button class="btn-confirm" @click="confirmPublish">确认发布</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MdEditor } from 'md-editor-v3'
import type { ToolbarNames, ExposeParam } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

// 简单的消息提示函数
const showMessage = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
  const msgDiv = document.createElement('div')
  msgDiv.className = `toast-message toast-${type}`
  msgDiv.textContent = message
  document.body.appendChild(msgDiv)
  
  setTimeout(() => {
    msgDiv.classList.add('show')
  }, 10)
  
  setTimeout(() => {
    msgDiv.classList.remove('show')
    setTimeout(() => {
      document.body.removeChild(msgDiv)
    }, 300)
  }, 2000)
}

const router = useRouter()
const route = useRoute()

// 文章数据
const articleTitle = ref('')
const content = ref('')
const articleForm = ref({
  category: '',
  tags: [] as string[],
  image: ''
})

// 弹窗控制
const showPublishDialog = ref(false)

// 自定义工具栏按钮 - 对齐功能（数组格式）
const defToolbars: any = [
  {
    title: '左对齐',
    icon: `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <path d="M120 230h784c17.7 0 32-14.3 32-32s-14.3-32-32-32H120c-17.7 0-32 14.3-32 32s14.3 32 32 32zM120 486h560c17.7 0 32-14.3 32-32s-14.3-32-32-32H120c-17.7 0-32 14.3-32 32s14.3 32 32 32zM120 742h784c17.7 0 32-14.3 32-32s-14.3-32-32-32H120c-17.7 0-32 14.3-32 32s14.3 32 32 32z" fill="currentColor"/>
    </svg>`,
    action(editor: ExposeParam) {
      editor.insert((selectedText: string) => {
        const text = selectedText || '这里是左对齐的文本'
        return {
          targetValue: `<div style="text-align: left">\n\n${text}\n\n</div>`,
          select: true,
          deviationStart: 0,
          deviationEnd: 0
        }
      })
    }
  },
  {
    title: '居中对齐',
    icon: `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <path d="M120 230h784c17.7 0 32-14.3 32-32s-14.3-32-32-32H120c-17.7 0-32 14.3-32 32s14.3 32 32 32zM232 486h560c17.7 0 32-14.3 32-32s-14.3-32-32-32H232c-17.7 0-32 14.3-32 32s14.3 32 32 32zM120 742h784c17.7 0 32-14.3 32-32s-14.3-32-32-32H120c-17.7 0-32 14.3-32 32s14.3 32 32 32z" fill="currentColor"/>
    </svg>`,
    action(editor: ExposeParam) {
      editor.insert((selectedText: string) => {
        const text = selectedText || '这里是居中对齐的文本'
        return {
          targetValue: `<div style="text-align: center">\n\n${text}\n\n</div>`,
          select: true,
          deviationStart: 0,
          deviationEnd: 0
        }
      })
    }
  },
  {
    title: '右对齐',
    icon: `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <path d="M120 230h784c17.7 0 32-14.3 32-32s-14.3-32-32-32H120c-17.7 0-32 14.3-32 32s14.3 32 32 32zM344 486h560c17.7 0 32-14.3 32-32s-14.3-32-32-32H344c-17.7 0-32 14.3-32 32s14.3 32 32 32zM120 742h784c17.7 0 32-14.3 32-32s-14.3-32-32-32H120c-17.7 0-32 14.3-32 32s14.3 32 32 32z" fill="currentColor"/>
    </svg>`,
    action(editor: ExposeParam) {
      editor.insert((selectedText: string) => {
        const text = selectedText || '这里是右对齐的文本'
        return {
          targetValue: `<div style="text-align: right">\n\n${text}\n\n</div>`,
          select: true,
          deviationStart: 0,
          deviationEnd: 0
        }
      })
    }
  },
  {
    title: '两端对齐',
    icon: `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <path d="M120 230h784c17.7 0 32-14.3 32-32s-14.3-32-32-32H120c-17.7 0-32 14.3-32 32s14.3 32 32 32zM120 486h784c17.7 0 32-14.3 32-32s-14.3-32-32-32H120c-17.7 0-32 14.3-32 32s14.3 32 32 32zM120 742h784c17.7 0 32-14.3 32-32s-14.3-32-32-32H120c-17.7 0-32 14.3-32 32s14.3 32 32 32z" fill="currentColor"/>
    </svg>`,
    action(editor: ExposeParam) {
      editor.insert((selectedText: string) => {
        const text = selectedText || '这里是两端对齐的文本'
        return {
          targetValue: `<div style="text-align: justify">\n\n${text}\n\n</div>`,
          select: true,
          deviationStart: 0,
          deviationEnd: 0
        }
      })
    }
  }
]

// 工具栏配置 - 添加对齐按钮（使用数字索引引用 defToolbars）
const toolbars: any = [
  'bold',
  'underline',
  'italic',
  'strikeThrough',
  '-',
  'title',
  'sub',
  'sup',
  'quote',
  'unorderedList',
  'orderedList',
  'task',
  '-',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  'mermaid',
  'katex',
  '-',
  'revoke',
  'next',
  '-',
  'save',
  '=',
  'pageFullscreen',
  'fullscreen',
  'preview',
  'htmlPreview',
  'catalog',
  '-',
  // 自定义对齐按钮（使用数字索引对应 defToolbars 数组）
  0, // 左对齐（defToolbars[0]）
  1, // 居中对齐（defToolbars[1]）
  2, // 右对齐（defToolbars[2]）
  3  // 两端对齐（defToolbars[3]）
]

// 可选标签列表
const availableTags = [
  'Vue3', 'React', 'TypeScript', 'JavaScript', 
  'Node.js', 'Java', 'Python', 'Go',
  '性能优化', '架构设计', '面试'
]

// 自动保存定时器
let autoSaveTimer: ReturnType<typeof setInterval> | null = null

// 从后端加载草稿或恢复自动保存
onMounted(async () => {
  const id = route.query.id as string
  console.log('id', id, route)
  if (id) {
    // 编辑文章：从后端获取
    try {
      const response = await fetch(`/api/articles/${id}`)
      const result = await response.json()
      if (result.success && result.data) {
        const article = result.data
        articleTitle.value = article.title || ''
        content.value = article.content || ''
        articleForm.value = {
          category: article.category || '',
          tags: article.tags || [],
          image: article.image || ''
        }
      }
    } catch (error) {
      showMessage('加载草稿失败', 'error')
    }
  } else {
    showMessage('文章不存在', 'error')
  }
  
  // 开启自动保存（每30秒，仅保存到本地）
  autoSaveTimer = setInterval(() => {
    if (articleTitle.value || content.value) {
      localStorage.setItem('article_auto_save', JSON.stringify({
        title: articleTitle.value,
        content: content.value,
        timestamp: Date.now()
      }))
    }
  }, 30000)
})

// 清理定时器
onBeforeUnmount(() => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
})

// 返回
const goBack = () => {
  if (articleTitle.value || content.value) {
    if (confirm('有未保存的内容，确定要离开吗？')) {
      router.back()
    }
  } else {
    router.back()
  }
}

// 保存草稿
const saveDraft = async () => {
  if (!articleTitle.value.trim()) {
    showMessage('请输入文章标题', 'warning')
    return
  }
  
  if (!content.value.trim()) {
    showMessage('请输入文章内容', 'warning')
    return
  }
  
  try {
    const draftId = route.query.draftId as string
    const summary = content.value.replace(/[#*`\[\]]/g, '').trim().substring(0, 100)
    
    const articleData = {
      title: articleTitle.value,
      content: content.value,
      summary,
      author: 'kim',
      category: articleForm.value.category || 'Uncategorized',
      tags: articleForm.value.tags,
      status: 'draft'
    }
    
    let response
    if (draftId) {
      // 更新现有草稿
      response = await fetch(`/api/articles/${draftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      })
    } else {
      // 创建新草稿
      response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      })
    }
    
    const result = await response.json()
    
    if (result.success) {
      // 如果是新创建的草稿，更新路由参数（避免重复创建）
      if (!draftId && result.data.entityId) {
        router.replace({ 
          path: '/blog/editor', 
          query: { draftId: result.data.entityId } 
        })
      }
      
      localStorage.removeItem('article_auto_save')
      showMessage('草稿保存成功', 'success')
    } else {
      throw new Error(result.message || '保存失败')
    }
  } catch (error) {
    console.error('保存草稿失败:', error)
    showMessage('保存失败，请稍后重试', 'error')
  }
}

// 发布文章
const publishArticle = () => {
  if (!articleTitle.value.trim()) {
    showMessage('请输入文章标题', 'warning')
    return
  }
  
  if (!content.value.trim()) {
    showMessage('请输入文章内容', 'warning')
    return
  }
  
  showPublishDialog.value = true
}

// 确认发布
const confirmPublish = async () => {
  if (!articleForm.value.category) {
    showMessage('请选择文章分类', 'warning')
    return
  }
  
  if (articleForm.value.tags.length === 0) {
    showMessage('请至少选择一个标签', 'warning')
    return
  }
  
  try {
    const draftId = route.query.draftId as string
    const summary = content.value.replace(/[#*`\[\]]/g, '').trim().substring(0, 200)
    
    const articleData = {
      title: articleTitle.value,
      content: content.value,
      summary,
      author: 'kim',
      category: articleForm.value.category,
      tags: articleForm.value.tags,
      status: 'published'
    }
    
    let response
    if (draftId) {
      // 从草稿发布：更新状态为 published (RESTful: PUT /:id)
      response = await fetch(`/api/articles/${draftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      })
    } else {
      // 直接发布新文章 (RESTful: POST /)
      response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      })
    }
    
    const result = await response.json()
    
    if (result.success) {
      localStorage.removeItem('article_auto_save')
      showPublishDialog.value = false
      showMessage('文章发布成功', 'success')
      
      // 跳转到我的文章
      setTimeout(() => {
        router.push({ path: '/blog', query: { tab: 'mine' } })
      }, 500)
    } else {
      throw new Error(result.message || '发布失败')
    }
  } catch (error) {
    console.error('发布文章失败:', error)
    showMessage('发布失败，请稍后重试', 'error')
  }
}
</script>

<style scoped lang="scss">
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f4f5f5;
  
  // 顶部操作栏
  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #ffffff;
    padding: 12px 24px;
    border-bottom: 1px solid #e4e6eb;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
      
      .back-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 16px;
        background: transparent;
        border: 1px solid #e4e6eb;
        border-radius: 4px;
        color: #252933;
        cursor: pointer;
        transition: all 0.2s;
        
        .icon {
          width: 16px;
          height: 16px;
          fill: currentColor;
        }
        
        &:hover {
          background: #f4f5f5;
          border-color: #1e80ff;
          color: #1e80ff;
        }
      }
      
      .title-input {
        flex: 1;
        max-width: 500px;
        padding: 10px 16px;
        border: 1px solid #e4e6eb;
        border-radius: 4px;
        font-size: 16px;
        color: #252933;
        outline: none;
        transition: border-color 0.2s;
        
        &:focus {
          border-color: #1e80ff;
        }
        
        &::placeholder {
          color: #8a919f;
        }
      }
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
      
      button {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        
        .icon {
          width: 16px;
          height: 16px;
          fill: currentColor;
        }
      }
      
      .btn-secondary {
        background: #ffffff;
        border: 1px solid #e4e6eb;
        color: #252933;
        
        &:hover {
          background: #f4f5f5;
          border-color: #1e80ff;
          color: #1e80ff;
        }
      }
      
      .btn-primary {
        background: #1e80ff;
        color: #ffffff;
        
        &:hover {
          background: #0066e6;
        }
      }
    }
  }
  
  // 编辑器内容区
  .editor-content {
    flex: 1;
    overflow: hidden;
    padding: 16px;
    
    :deep(.md-editor) {
      height: 100%;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .editor-container {
    .editor-header {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      
      .header-left {
        .title-input {
          max-width: none;
        }
      }
      
      .header-right {
        justify-content: flex-end;
        
        button {
          padding: 8px 16px;
          font-size: 13px;
        }
      }
    }
    
    .editor-content {
      padding: 8px;
    }
  }
}

// 弹窗样式
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s;
  
  .dialog-content {
    background: #ffffff;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    animation: slideUp 0.3s;
    
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      border-bottom: 1px solid #e4e6eb;
      
      .dialog-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #252933;
      }
      
      .dialog-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        
        .icon {
          width: 16px;
          height: 16px;
          fill: #8a919f;
        }
        
        &:hover {
          background: #f4f5f5;
          
          .icon {
            fill: #252933;
          }
        }
      }
    }
    
    .dialog-body {
      padding: 20px;
      
      .form-group {
        margin-bottom: 20px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .form-label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #252933;
        }
        
        .form-select,
        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e4e6eb;
          border-radius: 4px;
          font-size: 14px;
          color: #252933;
          outline: none;
          transition: border-color 0.2s;
          
          &:focus {
            border-color: #1e80ff;
          }
          
          &::placeholder {
            color: #8a919f;
          }
        }
        
        .form-select {
          background: #ffffff;
          cursor: pointer;
        }
        
        .tag-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          
          .tag-checkbox {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            background: #f4f5f5;
            border: 1px solid #e4e6eb;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            user-select: none;
            
            input[type="checkbox"] {
              cursor: pointer;
            }
            
            span {
              font-size: 13px;
              color: #252933;
            }
            
            &:hover {
              background: #e8ecf4;
              border-color: #1e80ff;
            }
            
            &.disabled {
              opacity: 0.5;
              cursor: not-allowed;
              
              &:hover {
                background: #f4f5f5;
                border-color: #e4e6eb;
              }
            }
            
            input[type="checkbox"]:checked + span {
              color: #1e80ff;
              font-weight: 500;
            }
          }
        }
      }
    }
    
    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid #e4e6eb;
      
      button {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .btn-cancel {
        background: #ffffff;
        border: 1px solid #e4e6eb;
        color: #252933;
        
        &:hover {
          background: #f4f5f5;
          border-color: #8a919f;
        }
      }
      
      .btn-confirm {
        background: #1e80ff;
        color: #ffffff;
        
        &:hover {
          background: #0066e6;
        }
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>

<!-- Toast消息全局样式 -->
<style>
.toast-message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(-100px);
  padding: 12px 20px;
  border-radius: 4px;
  color: #ffffff;
  font-size: 14px;
  z-index: 3000;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-message.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.toast-success {
  background: #52c41a;
}

.toast-warning {
  background: #faad14;
}

.toast-error {
  background: #ff4d4f;
}
</style>

