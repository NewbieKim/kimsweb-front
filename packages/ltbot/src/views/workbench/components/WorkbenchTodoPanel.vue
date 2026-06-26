<template>
  <aside class="panel hero-side">
    <WorkbenchSectionHead title="AI 待办" tag="智能排序" />
    <div class="todo-actions">
      <button class="add-btn" type="button" @click="openAddModal">新增待办</button>
      <button class="refresh-btn" type="button" :disabled="store.loading" @click="loadTodos">刷新</button>
    </div>

    <div v-if="store.error" class="error-message">{{ store.error }}</div>
    <div v-if="store.loading && sortedTodos.length === 0" class="state-message">待办加载中...</div>

    <div class="task-list">
      <div
        v-for="todo in sortedTodos"
        :key="getTodoId(todo)"
        class="task-card"
        :class="{ completed: todo.status === 'completed', cancelled: todo.status === 'cancelled' }"
      >
        <input
          class="checkbox"
          type="checkbox"
          :checked="todo.status === 'completed'"
          :disabled="store.loading"
          @change="toggleTodo(todo)"
        />
        <div class="task-content">
          <h3 class="card-title">{{ todo.title }}</h3>
          <p v-if="todo.description" class="card-desc">{{ todo.description }}</p>
          <p class="card-time">更新于 {{ formatDate(todo.updatedAt || todo.createdAt) }}</p>
        </div>
        <span class="priority" :class="todo.priority">{{ getPriorityText(todo.priority) }}</span>
        <button
          class="delete-btn"
          type="button"
          :disabled="store.loading"
          title="删除待办"
          @click="deleteTodo(todo)"
        >
          删除
        </button>
      </div>
      <div v-if="!store.loading && sortedTodos.length === 0" class="state-message">
        暂无待办事项，点击“新增待办”创建第一条。
      </div>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>新增待办事项</h3>
          <button class="close-btn" type="button" @click="closeAddModal">×</button>
        </div>
        <div class="form-body">
          <label class="form-item">
            <span>标题 *</span>
            <input
              v-model="todoForm.title"
              maxlength="50"
              placeholder="请输入待办标题"
            />
          </label>
          <label class="form-item">
            <span>描述</span>
            <textarea
              v-model="todoForm.description"
              maxlength="200"
              placeholder="请输入待办描述"
              rows="3"
            ></textarea>
          </label>
          <div class="form-item">
            <span>优先级</span>
            <div class="priority-options">
              <label
                v-for="option in priorityOptions"
                :key="option.value"
                class="priority-option"
                :class="{ selected: todoForm.priority === option.value }"
              >
                <input v-model="todoForm.priority" type="radio" :value="option.value" />
                {{ option.label }}
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" type="button" @click="closeAddModal">取消</button>
          <button
            class="confirm-btn"
            type="button"
            :disabled="store.loading || !todoForm.title.trim()"
            @click="addTodo"
          >
            确认添加
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useAgencyStore } from '@/stores/modules/agency'
import type { Agency } from '@/types'
import WorkbenchSectionHead from './WorkbenchSectionHead.vue'

const store = useAgencyStore()
const showAddModal = ref(false)
const todoForm = reactive({
  title: '',
  description: '',
  priority: 'medium' as Agency['priority']
})

const priorityOptions: Array<{ value: Agency['priority']; label: string }> = [
  { value: 'high', label: '高优先级' },
  { value: 'medium', label: '中优先级' },
  { value: 'low', label: '低优先级' }
]

const priorityWeights: Record<Agency['priority'], number> = {
  high: 3,
  medium: 2,
  low: 1
}

const sortedTodos = computed(() => {
  return [...store.agencies].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'completed' ? 1 : -1
    }

    const priorityGap = priorityWeights[b.priority] - priorityWeights[a.priority]
    if (priorityGap !== 0) {
      return priorityGap
    }

    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  })
})

function getTodoId(todo: Agency) {
  return todo.entityId || todo.id || todo.title
}

function getPriorityText(priority: Agency['priority']) {
  return priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'
}

function formatDate(date?: string) {
  if (!date) {
    return '--'
  }

  return new Date(date).toLocaleDateString()
}

function openAddModal() {
  todoForm.title = ''
  todoForm.description = ''
  todoForm.priority = 'medium'
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
}

async function loadTodos() {
  await store.fetchAgencies()
}

async function addTodo() {
  const title = todoForm.title.trim()
  if (!title) {
    return
  }

  await store.createAgency({
    title,
    description: todoForm.description.trim(),
    status: 'pending',
    priority: todoForm.priority
  })
  closeAddModal()
}

async function toggleTodo(todo: Agency) {
  const id = getTodoId(todo)
  if (!id) {
    return
  }

  await store.updateAgency(id, {
    status: todo.status === 'completed' ? 'pending' : 'completed'
  })
}

async function deleteTodo(todo: Agency) {
  const id = getTodoId(todo)
  if (!id) {
    return
  }

  await store.deleteAgency(id)
}

onMounted(loadTodos)
</script>

<style lang="scss" scoped>
.panel {
  border: 1px solid var(--workbench-line);
  border-radius: 12px;
  background: var(--workbench-panel);
  box-shadow: var(--workbench-shadow);
}

.hero-side {
  padding: 20px;
}

.todo-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.add-btn,
.refresh-btn {
  height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  transition: all 0.25s ease;
}

.add-btn {
  color: #fff;
  background: linear-gradient(135deg, #3f7cff, #245ee8);
}

.refresh-btn {
  color: var(--workbench-blue);
  background: var(--workbench-blue-soft);
}

.add-btn:hover,
.refresh-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(63, 124, 255, 0.12);
}

.add-btn:disabled,
.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.error-message,
.state-message {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.5;
}

.error-message {
  color: #b42318;
  background: #fef3f2;
}

.state-message {
  color: var(--workbench-muted);
  background: #f8fbff;
}

.task-list {
  display: grid;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.task-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid #edf1f7;
  border-radius: 12px;
  background: #fbfcff;
  transition: all 0.25s ease;
}

.task-card.completed {
  background: #f0f9ff;
}

.task-card.cancelled {
  opacity: 0.65;
}

.checkbox {
  width: 18px;
  height: 18px;
  margin-top: 3px;
  accent-color: var(--workbench-blue);
  cursor: pointer;
}

.card-title {
  margin: 0 0 6px;
  color: var(--workbench-text);
  font-size: 15px;
  font-weight: 800;
}

.task-card.completed .card-title {
  color: #6b7280;
  text-decoration: line-through;
}

.card-desc {
  margin: 0;
  color: var(--workbench-muted);
  font-size: 13px;
  line-height: 1.55;
}

.card-time {
  margin: 6px 0 0;
  color: #98a2b3;
  font-size: 12px;
}

.priority {
  min-width: 24px;
  padding: 3px 6px;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  text-align: center;
}

.priority.high {
  background: #ef4444;
}

.priority.medium {
  background: #f59e0b;
}

.priority.low {
  background: #16a36f;
}

.delete-btn {
  border: 0;
  padding: 4px 6px;
  border-radius: 6px;
  color: #b42318;
  background: #fef3f2;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}

.delete-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}

.modal-content {
  width: min(92vw, 500px);
  overflow: hidden;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
  text-align: left;
}

.modal-header,
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 22px;
  border-bottom: 1px solid #edf1f7;
}

.modal-header h3 {
  margin: 0;
  color: var(--workbench-text);
  font-size: 18px;
}

.close-btn {
  border: 0;
  background: transparent;
  cursor: pointer;
  color: #667085;
  font-size: 22px;
}

.form-body {
  display: grid;
  gap: 16px;
  padding: 22px;
  text-align: left;
}

.form-item {
  display: grid;
  gap: 8px;
  width: 100%;
  color: var(--workbench-text);
  font-size: 14px;
  font-weight: 700;
  text-align: left;
}

.form-item > span {
  display: block;
  width: 100%;
  text-align: left;
}

.form-item input,
.form-item textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #dbe4f3;
  border-radius: 10px;
  padding: 11px 12px;
  outline: 0;
  color: var(--workbench-text);
  font-size: 14px;
}

.form-item textarea {
  resize: vertical;
}

.form-item input:focus,
.form-item textarea:focus {
  border-color: var(--workbench-blue);
  box-shadow: 0 0 0 3px rgba(63, 124, 255, 0.1);
}

.priority-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 10px;
  width: 100%;
}

.priority-option {
  padding: 8px 12px;
  border: 1px solid #dbe4f3;
  border-radius: 10px;
  cursor: pointer;
  color: #3c4963;
  background: #fff;
  font-size: 13px;
}

.priority-option input {
  display: none;
}

.priority-option.selected {
  border-color: var(--workbench-blue);
  color: var(--workbench-blue);
  background: var(--workbench-blue-soft);
}

.modal-footer {
  justify-content: flex-end;
  border-top: 1px solid #edf1f7;
  border-bottom: 0;
}

.cancel-btn,
.confirm-btn {
  border: 0;
  border-radius: 8px;
  padding: 10px 18px;
  cursor: pointer;
  font-weight: 700;
}

.cancel-btn {
  color: #667085;
  background: #f2f4f7;
}

.confirm-btn {
  color: #fff;
  background: var(--workbench-blue);
}

.confirm-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
