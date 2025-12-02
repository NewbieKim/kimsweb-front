<template>
  <div class="todo-section">
    <div class="todo-header">
      <h3 class="todo-title">
        📝 我的待办
      </h3>
      <button class="add-btn" @click="openAddModal">
        ➕ 新增
      </button>
    </div>
    
    <!-- 新增待办弹框 -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4 class="modal-title">新增待办事项</h4>
          <button class="close-btn" @click="closeAddModal">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">待办标题 *</label>
            <input 
              v-model="todoForm.title" 
              placeholder="请输入待办标题..."
              class="form-input"
              maxlength="50"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">待办描述</label>
            <textarea 
              v-model="todoForm.description" 
              placeholder="请输入待办描述（可选）..."
              class="form-textarea"
              rows="3"
              maxlength="200"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label">优先级</label>
            <div class="priority-options">
              <label 
                v-for="priority in priorityOptions" 
                :key="priority.value"
                class="priority-option"
                :class="{ 'selected': todoForm.priority === priority.value }"
              >
                <input 
                  type="radio" 
                  :value="priority.value" 
                  v-model="todoForm.priority"
                  class="priority-radio"
                />
                <span class="priority-label" :class="`priority-${priority.value}`">
                  {{ priority.label }}
                </span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeAddModal">取消</button>
          <button class="confirm-btn" @click="addTodo" :disabled="!todoForm.title.trim()">
            确认添加
          </button>
        </div>
      </div>
    </div>

    <div class="todo-list">
      <div 
        v-for="(todo, index) in sortedTodos"
        :key="todo.id"
        class="todo-item"
        :class="{ 'completed': todo.status === 'completed', 'cancelled': todo.status === 'cancelled' }"
      >
        <input 
          type="checkbox"
          :checked="todo.status === 'completed'"
          @change="toggleTodo(todo)"
          class="todo-checkbox"
        />
        <div class="todo-content">
          <div class="todo-main">
            <span class="todo-title" :class="{ 'completed-text': todo.status === 'completed' }">
              {{ todo.title }}
            </span>
            <p class="todo-description" v-if="todo.description">
              {{ todo.description }}
            </p>
            <div class="todo-meta" v-if="todo.dueDate">
              <span class="todo-due-date">
                截止日期: {{ new Date(todo.dueDate).toLocaleDateString() }}
              </span>
            </div>
          </div>
        </div>
        <div class="todo-priority-wrapper">
          <span class="todo-priority" :class="`priority-${todo.priority}`">
            {{ todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低' }}
          </span>
        </div>
        <button 
          @click="deleteTodo(index)"
          class="delete-btn"
          title="删除"
        >
          🗑️
        </button>
      </div>
      
      <div v-if="useAgencyStore().agencies.length === 0" class="empty-todo">
        <div class="empty-content">
          📭
          <p>暂无待办事项</p>
          <small>点击"新增"按钮添加待办事项</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useAgencyStore } from '@/stores/modules/agency'

// 弹框状态
const showAddModal = ref(false)

// 表单数据
const todoForm = reactive({
  title: '',
  description: '',
  priority: 'medium' as 'high' | 'medium' | 'low'
})

// 优先级选项
const priorityOptions = [
  { value: 'high', label: '高优先级' },
  { value: 'medium', label: '中优先级' },
  { value: 'low', label: '低优先级' }
]

// 弹框控制方法
function openAddModal() {
  showAddModal.value = true
  // 重置表单
  todoForm.title = ''
  todoForm.description = ''
  todoForm.priority = 'medium'
}

function closeAddModal() {
  showAddModal.value = false
}

// 待办功能方法
async function addTodo() {
  if (todoForm.title.trim()) {
    const store = useAgencyStore()
    
    try {
      const agencyData = {
        title: todoForm.title.trim(),
        description: todoForm.description.trim(),
        status: 'pending' as const,
        priority: todoForm.priority
      }
      
      await store.createAgency(agencyData)
      await store.fetchAgencies()
      console.log('待办创建成功:', agencyData.title)
      closeAddModal()
    } catch (error) {
      console.error('创建待办失败:', error)
      // 可以在这里添加错误提示
    }
  }
}

async function deleteTodo(index: number) {
  const store = useAgencyStore()
  const todo = store.agencies[index]
  if (!todo) return
  
  try {
    await store.deleteAgency(todo.entityId)
    await store.fetchAgencies()
  } catch (error) {
    console.error('删除代办失败:', error)
    // 可以在这里添加错误提示
  }
}

function toggleTodo(todo: any) {
  // 切换待办事项状态
  todo.status = todo.status === 'completed' ? 'pending' : 'completed'
  todo.updatedAt = new Date().toISOString()
  console.log('Todo状态更新:', todo.title, '完成状态:', todo.status)
}


onMounted(async () => {
  await useAgencyStore().fetchAgencies()
})

// 计算排序后的待办列表
const sortedTodos = computed(() => {
  const agencies = useAgencyStore().agencies
  // 定义优先级权重：high > medium > low
  const priorityWeights = {
    high: 3,
    medium: 2,
    low: 1
  }
  
  return [...agencies].sort((a, b) => {
    // 按优先级权重降序排列（高优先级在前）
    const weightA = priorityWeights[a.priority] || 0
    const weightB = priorityWeights[b.priority] || 0
    
    if (weightA !== weightB) {
      return weightB - weightA
    }
    
    // 如果优先级相同，按创建时间降序排列（新的在前）
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  })
})
</script>

<style lang="scss" scoped>
.todo-section {
  flex: 1 1 auto;
  margin-bottom: 16px;
  max-height: 350px;
  
  .todo-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .todo-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
      display: flex;
      align-items: center;
    }
    
    .add-btn {
      background: #4285f4;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: #3367d6;
        transform: translateY(-1px);
      }
    }
  }

  // 弹框样式
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e9ecef;
    
    .modal-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
    
    .close-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
      
      &:hover {
        background: #f1f3f4;
        color: #333;
      }
    }
  }

  .modal-body {
    padding: 24px;
    
    .form-group {
      margin-bottom: 20px;
      
      .form-label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #333;
      }
      
      .form-input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.3s ease;
        
        &:focus {
          border-color: #4285f4;
          box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
        }
      }
      
      .form-textarea {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        resize: vertical;
        min-height: 80px;
        transition: border-color 0.3s ease;
        
        &:focus {
          border-color: #4285f4;
          box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
        }
      }
      
      .priority-options {
        display: flex;
        gap: 12px;
        
        .priority-option {
          display: flex;
          align-items: center;
          cursor: pointer;
          padding: 8px 12px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          transition: all 0.2s ease;
          
          &:hover {
            border-color: #4285f4;
            background: #f8f9ff;
          }
          
          &.selected {
            border-color: #4285f4;
            background: #e3f2fd;
          }
          
          .priority-radio {
            display: none;
          }
          
          .priority-label {
            font-size: 13px;
            font-weight: 500;
            
            &.priority-high {
              color: #dc2626;
            }
            
            &.priority-medium {
              color: #d97706;
            }
            
            &.priority-low {
              color: #16a34a;
            }
          }
        }
      }
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #e9ecef;
    
    .cancel-btn {
      background: #f1f3f4;
      color: #5f6368;
      border: 1px solid #e9ecef;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: #e8eaed;
        color: #3c4043;
      }
    }
    
    .confirm-btn {
      background: #4285f4;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover:not(:disabled) {
        background: #3367d6;
      }
      
      &:disabled {
        background: #e0e0e0;
        cursor: not-allowed;
      }
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideIn {
    from { 
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .todo-list {
    max-height: 280px;
    overflow-y: auto;
    
    .todo-item {
      display: flex;
      align-items: stretch;
      padding: 12px;
      margin-bottom: 8px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
      transition: all 0.3s ease;
      min-height: 60px;
      
      &:hover {
        background: #e9ecef;
        border-color: #4285f4;
      }
      
      &.completed {
        background: #f0f9ff;
        border-color: #bfdbfe;
      }
      
      .todo-checkbox {
        margin-right: 12px;
        width: 16px;
        height: 16px;
        accent-color: #4285f4;
        cursor: pointer;
        align-self: flex-start;
        margin-top: 2px;
      }
      
      .todo-content {
        flex: 1;
        display: flex;
        align-items: flex-start;
        
        .todo-main {
          flex: 1;
          text-align: left;
          
          .todo-title {
            font-size: 15px;
            color: #333;
            line-height: 1.4;
            margin-bottom: 4px;
            font-weight: 500;
            
            &.completed-text {
              text-decoration: line-through;
              color: #6b7280;
            }
          }
          
          .todo-description {
            font-size: 13px;
            color: #666;
            margin: 0 0 6px 0;
            line-height: 1.4;
            word-break: break-word;
          }
          
          .todo-meta {
            font-size: 11px;
            
            .todo-due-date {
              color: #6b7280;
              background: #f1f3f4;
              padding: 2px 6px;
              border-radius: 4px;
            }
          }
        }
      }
      
      .todo-priority-wrapper {
        display: flex;
        align-items: center;
        margin: 0 12px;
        
        .todo-priority {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          
          &.priority-high {
            background: #fee2e2;
            color: #dc2626;
            border: 1px solid #fecaca;
          }
          
          &.priority-medium {
            background: #fef3c7;
            color: #d97706;
            border: 1px solid #fed7aa;
          }
          
          &.priority-low {
            background: #dcfce7;
            color: #16a34a;
            border: 1px solid #bbf7d0;
          }
        }
      }
      
      .delete-btn {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        opacity: 0;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.3s ease;
        align-self: flex-start;
        margin-top: 2px;
        
        &:hover {
          background: rgba(244, 67, 54, 0.1);
          transform: scale(1.1);
        }
      }
      
      &:hover .delete-btn {
        opacity: 1;
      }
    }
    
    .empty-todo {
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
      
      .empty-content {
        font-size: 48px;
        margin-bottom: 16px;
        
        p {
          font-size: 16px;
          margin: 8px 0 4px 0;
          color: #333;
        }
        
        small {
          font-size: 12px;
          color: #9ca3af;
        }
      }
    }
  }
}
</style>
