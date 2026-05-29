<template>
  <div class="user-data-manage">
    <div class="page-header">
      <h3>用户数据管理</h3>
    </div>

    <div class="toolbar">
      <tiny-input
        v-model="keyword"
        class="keyword-input"
        clearable
        placeholder="搜索昵称 / 邮箱 / 用户ID"
        @keyup.enter="handleSearch"
      />
      <tiny-date-picker
        v-model="registerDateRange"
        class="date-range-picker"
        type="daterange"
        value-format="yyyy-MM-dd"
        range-separator="至"
        start-placeholder="注册开始日期"
        end-placeholder="注册结束日期"
      />
      <div class="quick-range-buttons">
        <tiny-button size="mini" @click="applyQuickRange(7)">近7天</tiny-button>
        <tiny-button size="mini" @click="applyQuickRange(30)">近30天</tiny-button>
        <tiny-button size="mini" @click="applyQuickRange(90)">近90天</tiny-button>
      </div>
      <tiny-button type="primary" @click="handleSearch">搜索</tiny-button>
      <tiny-button @click="handleReset">重置</tiny-button>
    </div>

    <div v-if="listError" class="error-text">{{ listError }}</div>

    <tiny-grid :data="users" height="520" style="width: 100%">
      <tiny-grid-column field="id" title="用户ID" min-width="170" />
      <tiny-grid-column title="用户信息" min-width="220">
        <template #default="{ row }">
          <div class="user-info-cell">
            <tiny-user-head
              :model-value="row.avatar || ''"
              type="image"
              round
              min
            />
            <div class="user-meta">
              <div class="name">{{ row.name || '-' }}</div>
              <div class="email">{{ row.email || '-' }}</div>
            </div>
          </div>
        </template>
      </tiny-grid-column>
      <tiny-grid-column field="age" title="年龄" width="90">
        <template #default="{ row }">{{ row.age ?? '-' }}</template>
      </tiny-grid-column>
      <tiny-grid-column field="scoreBalance" title="积分余额" width="110" />
      <tiny-grid-column field="storyCount" title="故事数" width="90" />
      <tiny-grid-column field="transactionCount" title="交易数" width="90" />
      <tiny-grid-column field="commentCount" title="评论数" width="90" />
      <tiny-grid-column title="最近活跃" min-width="180">
        <template #default="{ row }">{{ formatDateTime(row.lastActiveAt) }}</template>
      </tiny-grid-column>
      <tiny-grid-column title="注册时间" min-width="180">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </tiny-grid-column>
      <tiny-grid-column title="操作" width="120" fixed="right">
        <template #default="{ row }">
          <tiny-button type="primary" size="mini" @click.stop="handleDetailClick(row)">
            详情
          </tiny-button>
        </template>
      </tiny-grid-column>
    </tiny-grid>

    <tiny-pager
      :current-page="pager.page"
      :page-size="pager.pageSize"
      :total="pager.total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      @current-change="handlePageChange"
      @size-change="handlePageSizeChange"
    />

    <div v-if="detailVisible" class="drawer-mask" @click="closeDetailDrawer"></div>
    <aside v-if="detailVisible" ref="detailCardRef" class="detail-drawer">
      <div class="drawer-header">
        <div class="drawer-title">用户详情：{{ selectedUserId }}</div>
        <tiny-button size="mini" @click="closeDetailDrawer">关闭</tiny-button>
      </div>

      <div v-if="detailLoading" class="detail-loading">详情加载中...</div>
      <div v-else-if="detailError" class="error-text">{{ detailError }}</div>
      <template v-else-if="detailData">
        <div class="detail-overview">
          <div class="overview-item">积分余额：{{ detailData.overview.scoreBalance }}</div>
          <div class="overview-item">故事数：{{ detailData.overview.storyCount }}</div>
          <div class="overview-item">交易数：{{ detailData.overview.transactionCount }}</div>
          <div class="overview-item">点赞数：{{ detailData.overview.likeCount }}</div>
          <div class="overview-item">收藏数：{{ detailData.overview.favoriteCount }}</div>
          <div class="overview-item">评论数：{{ detailData.overview.commentCount }}</div>
        </div>

        <div class="section-title">extData</div>
        <pre class="json-box">{{ formatJson(detailData.user.extData) }}</pre>

        <div class="section-title">故事列表（最近30条）</div>
        <div class="data-list">
          <div
            v-for="story in detailData.user.stories"
            :key="story.id"
            class="data-item"
          >
            <span>ID: {{ story.id }}</span>
            <span>主题: {{ getStoryTheme(story) }}</span>
            <span>年龄段: {{ story.ageGroup }}</span>
            <span>点赞/收藏/评论: {{ story._count.likes }}/{{ story._count.favorites }}/{{ story._count.comments }}</span>
            <span>创建时间: {{ formatDateTime(story.createdAt) }}</span>
          </div>
          <div v-if="detailData.user.stories.length === 0" class="empty-text">暂无故事数据</div>
        </div>

        <div class="section-title">交易记录（最近50条）</div>
        <div class="data-list">
          <div
            v-for="tx in detailData.user.scoreTransactions"
            :key="tx.id"
            class="data-item"
          >
            <span>ID: {{ tx.id }}</span>
            <span>类型: {{ tx.transactionType }}</span>
            <span>金额: {{ tx.amount }}</span>
            <span>余额: {{ tx.balanceBefore }} -> {{ tx.balanceAfter }}</span>
            <span>关联故事/音乐: {{ tx.storyId || '-' }} / {{ tx.musicId || '-' }}</span>
            <span>时间: {{ formatDateTime(tx.createdAt) }}</span>
          </div>
          <div v-if="detailData.user.scoreTransactions.length === 0" class="empty-text">暂无交易数据</div>
        </div>
      </template>
    </aside>
    <div v-if="detailVisible" class="drawer-placeholder"></div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';
import {
  TinyButton,
  TinyDatePicker,
  TinyGrid,
  TinyGridColumn,
  TinyInput,
  TinyModal,
  TinyPager,
  TinyUserHead,
} from '@opentiny/vue';
import { fetchAdminUserDetail, fetchAdminUsers } from '../services/users';
import type { AdminUserDetailResponse, AdminUserListItem } from '../types/admin';

const keyword = ref('');
const users = ref<AdminUserListItem[]>([]);
const listError = ref('');
const selectedUserId = ref('');
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailError = ref('');
const detailData = ref<AdminUserDetailResponse | null>(null);
const detailCardRef = ref<HTMLElement | null>(null);
const registerDateRange = ref<string[]>([]);
const pager = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

async function loadUsers() {
  listError.value = '';
  try {
    const response = await fetchAdminUsers({
      page: pager.page,
      pageSize: pager.pageSize,
      keyword: keyword.value.trim(),
      registerStartDate: registerDateRange.value[0] || undefined,
      registerEndDate: registerDateRange.value[1] || undefined,
    });
    users.value = response.list;
    pager.total = response.pagination.total;
  } catch (error) {
    console.error('加载用户列表失败:', error);
    listError.value = error instanceof Error ? error.message : '加载用户列表失败';
    TinyModal.message({
      status: 'error',
      message: listError.value,
    });
  }
}

async function showDetail(userId: string) {
  if (!userId) {
    TinyModal.message({
      status: 'warning',
      message: '当前行缺少用户ID，无法加载详情',
    });
    return;
  }
  selectedUserId.value = userId;
  detailVisible.value = true;
  detailLoading.value = true;
  detailError.value = '';
  detailData.value = null;
  await nextTick();
  detailCardRef.value?.scrollTo({ top: 0, behavior: 'smooth' });
  try {
    detailData.value = await fetchAdminUserDetail(userId);
  } catch (error) {
    console.error('加载用户详情失败:', error);
    detailError.value = error instanceof Error ? error.message : '加载用户详情失败';
    TinyModal.message({
      status: 'error',
      message: `加载用户详情失败：${detailError.value}`,
    });
  } finally {
    detailLoading.value = false;
  }
}

function handleDetailClick(row: Partial<AdminUserListItem> & { userId?: string }) {
  const userId = String(row.id || row.userId || '').trim();
  showDetail(userId);
}

function closeDetailDrawer() {
  detailVisible.value = false;
}

function handleSearch() {
  const [startDate, endDate] = registerDateRange.value;
  if (startDate && endDate && startDate > endDate) {
    TinyModal.message({
      status: 'warning',
      message: '注册开始时间不能晚于结束时间',
    });
    return;
  }
  pager.page = 1;
  loadUsers();
}

function handleReset() {
  keyword.value = '';
  registerDateRange.value = [];
  pager.page = 1;
  loadUsers();
}

function applyQuickRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - Math.max(0, days - 1));
  registerDateRange.value = [formatDate(start), formatDate(end)];
  pager.page = 1;
  loadUsers();
}

function handlePageChange(page: number) {
  pager.page = Number(page) || 1;
  loadUsers();
}

function handlePageSizeChange(pageSize: number) {
  pager.pageSize = Number(pageSize) || 10;
  pager.page = 1;
  loadUsers();
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return String(value);
  }
}

function getStoryTheme(story: {
  customTheme?: string | null;
  classicSubTheme?: string | null;
  classicTheme?: string | null;
  themeType: string;
}) {
  return story.customTheme || story.classicSubTheme || story.classicTheme || story.themeType;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

onMounted(() => {
  loadUsers();
});
</script>

<style scoped lang="less">
.user-data-manage {
  .page-header {
    margin-bottom: 12px;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.keyword-input {
  width: 320px;
}

.date-range-picker {
  width: 340px;
}

.quick-range-buttons {
  display: flex;
  gap: 6px;
}

.user-info-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-meta {
  min-width: 0;
}

.name {
  font-weight: 600;
}

.email {
  color: #666;
  font-size: 12px;
}

.drawer-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 1000;
}

.detail-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 52%;
  max-width: 860px;
  min-width: 620px;
  height: 100vh;
  background: #fff;
  z-index: 1001;
  box-shadow: -6px 0 18px rgba(0, 0, 0, 0.18);
  padding: 14px;
  overflow: auto;
  box-sizing: border-box;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.drawer-title {
  font-size: 16px;
  font-weight: 600;
}

.drawer-placeholder {
  height: 0;
}

.detail-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.overview-item {
  padding: 8px 10px;
  background: #f7f8fa;
  border-radius: 4px;
}

.section-title {
  margin-top: 14px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
}

.json-box {
  background: #f7f8fa;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 220px;
  overflow: auto;
}

.data-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-item {
  display: grid;
  grid-template-columns: 100px 1fr 120px 180px 220px 220px;
  gap: 8px;
  background: #fafafa;
  border-radius: 6px;
  padding: 8px;
  font-size: 12px;
}

.error-text {
  color: #e34d59;
  margin-bottom: 8px;
}

.detail-loading,
.empty-text {
  color: #666;
}
</style>
