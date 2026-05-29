<template>
  <div class="dashboard-container">
    <div class="page-header">
      <h3>AI 睡眠伙伴运营看板</h3>
      <div class="filters">
        <tiny-select v-model="quickRange" style="width: 120px" @change="handleQuickRangeChange">
          <tiny-option :value="7" label="近7天" />
          <tiny-option :value="14" label="近14天" />
          <tiny-option :value="30" label="近30天" />
        </tiny-select>
        <input v-model="startDate" type="date" class="date-input" />
        <span class="to-text">至</span>
        <input v-model="endDate" type="date" class="date-input" />
        <tiny-button type="primary" @click="handleRefresh">刷新</tiny-button>
      </div>
    </div>

    <div v-if="errorMessage" class="state error-state">{{ errorMessage }}</div>
    <div v-else-if="loading" class="state">数据加载中...</div>

    <template v-else-if="metrics">
      <tiny-row :gutter="16" class="cards-row">
        <tiny-col v-for="card in overviewCards" :key="card.title" :span="4">
          <tiny-card class="metric-card" auto-width>
            <div class="metric-title">{{ card.title }}</div>
            <div class="metric-value">{{ card.value }}</div>
          </tiny-card>
        </tiny-col>
      </tiny-row>

      <tiny-row :gutter="16" class="charts-row">
        <tiny-col :span="12">
          <tiny-card auto-width title="UV 与故事创建趋势">
            <div ref="trendChartRef" class="chart"></div>
          </tiny-card>
        </tiny-col>
        <tiny-col :span="12">
          <tiny-card auto-width title="核心转化漏斗">
            <div ref="funnelChartRef" class="chart"></div>
          </tiny-card>
        </tiny-col>
      </tiny-row>

      <tiny-row :gutter="16" class="charts-row">
        <tiny-col :span="24">
          <tiny-card auto-width title="生成稳定性（近7天）">
            <div ref="stabilityChartRef" class="chart"></div>
            <div class="stability-meta">
              <span>生成成功率：{{ formatPercent(metrics.stability.generateSuccessRate) }}</span>
              <span>失败次数：{{ metrics.stability.generateFailedCount }}</span>
            </div>
          </tiny-card>
        </tiny-col>
      </tiny-row>

      <tiny-card auto-width title="最近失败故事">
        <div v-if="metrics.stability.recentFailedStories.length === 0" class="empty-state">
          当前时间范围内没有失败记录
        </div>
        <div v-else class="failed-list">
          <div
            v-for="item in metrics.stability.recentFailedStories"
            :key="`${item.storyId}-${item.failedAt}`"
            class="failed-item"
          >
            <span>故事ID: {{ item.storyId }}</span>
            <span>主题: {{ item.themeSummary }}</span>
            <span>失败时间: {{ formatDateTime(item.failedAt) }}</span>
            <span>原因: {{ item.errorMessage }}</span>
          </div>
        </div>
      </tiny-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import * as echarts from 'echarts';
import { TinyButton, TinyCard, TinyCol, TinyModal, TinyOption, TinyRow, TinySelect } from '@opentiny/vue';
import { fetchOperationMetrics } from '../services/operation';
import type { OperationMetrics } from '../types/admin';

const loading = ref(false);
const errorMessage = ref('');
const metrics = ref<OperationMetrics | null>(null);
const quickRange = ref(7);
const startDate = ref(formatDateInput(getDateBefore(6)));
const endDate = ref(formatDateInput(new Date()));

const trendChartRef = ref<HTMLElement | null>(null);
const funnelChartRef = ref<HTMLElement | null>(null);
const stabilityChartRef = ref<HTMLElement | null>(null);
let trendChart: echarts.ECharts | null = null;
let funnelChart: echarts.ECharts | null = null;
let stabilityChart: echarts.ECharts | null = null;

const overviewCards = computed(() => {
  if (!metrics.value) {
    return [];
  }
  const { overview } = metrics.value;
  return [
    { title: '网站访问 UV', value: overview.uv.toLocaleString() },
    { title: '注册人数', value: overview.registerUserCount.toLocaleString() },
    { title: '登录人数', value: overview.loginUserCount.toLocaleString() },
    { title: '故事创建数', value: overview.storyCreateCount.toLocaleString() },
    { title: '生成成功率', value: formatPercent(overview.generateSuccessRate) },
    { title: '朗读次数', value: overview.ttsPlayCount.toLocaleString() },
    { title: '反馈数量', value: overview.feedbackCount.toLocaleString() },
  ];
});

async function loadMetrics() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const data = await fetchOperationMetrics({
      startDate: startDate.value,
      endDate: endDate.value,
    });
    metrics.value = data;
    await nextTick();
    renderCharts();
  } catch (error) {
    console.error('加载运营看板失败:', error);
    errorMessage.value = error instanceof Error ? error.message : '加载运营看板失败';
    TinyModal.message({
      status: 'error',
      message: errorMessage.value,
    });
  } finally {
    loading.value = false;
  }
}

function handleQuickRangeChange(value: number) {
  quickRange.value = Number(value) || 7;
  endDate.value = formatDateInput(new Date());
  startDate.value = formatDateInput(getDateBefore(quickRange.value - 1));
  loadMetrics();
}

function handleRefresh() {
  if (!startDate.value || !endDate.value) {
    TinyModal.message({
      status: 'warning',
      message: '请选择完整的开始与结束日期',
    });
    return;
  }
  loadMetrics();
}

function renderCharts() {
  if (!metrics.value) {
    return;
  }
  if (trendChartRef.value && !trendChart) {
    trendChart = echarts.init(trendChartRef.value);
  }
  if (funnelChartRef.value && !funnelChart) {
    funnelChart = echarts.init(funnelChartRef.value);
  }
  if (stabilityChartRef.value && !stabilityChart) {
    stabilityChart = echarts.init(stabilityChartRef.value);
  }

  const trend = metrics.value.trend;
  trendChart?.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['UV', '故事创建'] },
    xAxis: { type: 'category', data: trend.map((item) => item.date) },
    yAxis: { type: 'value' },
    series: [
      { name: 'UV', type: 'line', smooth: true, data: trend.map((item) => item.uv) },
      {
        name: '故事创建',
        type: 'line',
        smooth: true,
        data: trend.map((item) => item.storyCreate),
      },
    ],
  });

  const funnelData = [
    ['UV', metrics.value.funnel.uv],
    ['登录/注册', metrics.value.funnel.loginOrRegister],
    ['创建故事', metrics.value.funnel.storyCreate],
    ['生成成功', metrics.value.funnel.generateSuccess],
    ['使用朗读', metrics.value.funnel.ttsPlay],
  ];

  funnelChart?.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: funnelData.map(([name]) => name),
      inverse: true,
    },
    series: [
      {
        type: 'bar',
        data: funnelData.map(([, value]) => value),
        label: { show: true, position: 'right' },
        itemStyle: { borderRadius: [0, 4, 4, 0] },
      },
    ],
  });

  const stabilityTrend = metrics.value.stability.generateTrend7Days;
  stabilityChart?.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['成功', '失败'] },
    xAxis: { type: 'category', data: stabilityTrend.map((item) => item.date) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '成功',
        type: 'bar',
        data: stabilityTrend.map((item) => item.success),
      },
      {
        name: '失败',
        type: 'bar',
        data: stabilityTrend.map((item) => item.failed),
      },
    ],
  });
}

function handleResize() {
  trendChart?.resize();
  funnelChart?.resize();
  stabilityChart?.resize();
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function getDateBefore(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

onMounted(() => {
  loadMetrics();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  trendChart?.dispose();
  funnelChart?.dispose();
  stabilityChart?.dispose();
});
</script>

<style scoped lang="less">
.dashboard-container {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    gap: 12px;
  }

  .filters {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.date-input {
  width: 146px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  padding: 0 8px;
}

.to-text {
  color: #666;
}

.cards-row,
.charts-row {
  margin-bottom: 16px;
}

.metric-card {
  min-height: 86px;

  .metric-title {
    color: #777;
    font-size: 13px;
    margin-bottom: 10px;
  }

  .metric-value {
    font-size: 22px;
    font-weight: 600;
    color: #1f2d3d;
  }
}

.chart {
  width: 100%;
  height: 320px;
}

.state {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  color: #666;
}

.error-state {
  color: #e34d59;
}

.empty-state {
  color: #888;
}

.failed-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.failed-item {
  display: grid;
  grid-template-columns: 110px 1fr 220px 1fr;
  gap: 12px;
  font-size: 13px;
  color: #333;
  background: #fafafa;
  border-radius: 6px;
  padding: 10px;
}

.stability-meta {
  margin-top: 12px;
  display: flex;
  gap: 20px;
  color: #666;
}
</style>
