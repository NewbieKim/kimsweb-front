<template>
  <div class="dashboard-container">
    <div class="page-header">
      <h3>总览</h3>
    </div>
    <!-- 商品统计卡片 -->
    <tiny-row :gutter="20" class="stats-cards">
      <tiny-col :span="8">
        <tiny-card class="stats-card" size="mini" title="商品总数" auto-width>
          <div class="stats-value">
            <span class="number">{{ store.productCount }}</span>
            <span class="label">个</span>
          </div>
        </tiny-card>
      </tiny-col>
      <tiny-col :span="8">
        <tiny-card class="stats-card" size="mini" title="上架商品" auto-width>
          <div class="stats-value">
            <span class="number">{{ store.activeProductCount }}</span>
            <span class="label">个</span>
          </div>
        </tiny-card>
      </tiny-col>
      <tiny-col :span="8">
        <tiny-card class="stats-card" size="mini" title="下架商品" auto-width>
          <div class="stats-value">
            <span class="number">{{
              store.productCount - store.activeProductCount
            }}</span>
            <span class="label">个</span>
          </div>
        </tiny-card>
      </tiny-col>
    </tiny-row>
    <br />
    <!-- 系统统计卡片 -->
    <tiny-row :gutter="20" class="system-stats">
      <tiny-col :span="8" v-for="card in statisticsCards" :key="card.title">
        <tiny-card class="stat-card" size="mini" auto-width>
          <div class="card-content">
            <div class="icon-wrapper" :class="card.iconClass">
              <component :is="card.icon" />
            </div>
            <div class="stat-info">
              <div class="stat-title">{{ card.title }}</div>
              <div class="stat-value">{{ card.value }}</div>
            </div>
          </div>
        </tiny-card>
      </tiny-col>
    </tiny-row>

    <!-- 系统监控图表 -->
    <tiny-row :gutter="20" class="monitor-charts">
      <tiny-col :span="6">
        <tiny-card auto-width title="在线用户趋势">
          <div ref="userChartRef" class="chart"></div>
        </tiny-card>
      </tiny-col>
      <tiny-col :span="6">
        <tiny-card auto-width title="网络流量趋势">
          <div ref="trafficChartRef" class="chart"></div>
        </tiny-card>
      </tiny-col>
    </tiny-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useStore } from '../store';
import { useStatisticsStore } from '../store/statistics';
import { storeToRefs } from 'pinia';
import * as echarts from 'echarts';
import { TinyModal, TinyRow, TinyCol, TinyCard } from '@opentiny/vue';
import { IconUser, IconLineChart } from '@opentiny/vue-icon';

const TinyIconUser = IconUser();
const TinyIconLineChart = IconLineChart();
const store = useStore();
const statisticsStore = useStatisticsStore();
const statistics = storeToRefs(statisticsStore);

// 商品分类标签
const categoryLabels: Record<string, string> = {
  phones: '手机',
  laptops: '笔记本',
  tablets: '平板',
};

// 最近添加的5个商品
const recentProducts = computed(() => {
  if (!store.products.length) return [];
  return [...store.products]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);
});

// 商品分类统计
const categoryStats = computed(() => {
  if (!store.products.length) return [];
  const stats = store.products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = store.productCount || 1; // 避免除以0
  return Object.entries(stats).map(([category, count]) => ({
    category,
    count,
    percentage: count / total,
  }));
});

// 系统统计卡片数据
const statisticsCards = computed(() => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return [
    {
      title: '在线用户',
      value: statisticsStore.onlineUsers || 0,
      icon: TinyIconUser,
      iconClass: 'bg-blue',
    },
    {
      title: '入站流量',
      value: formatBytes(statisticsStore.networkTraffic.incoming || 0),
      icon: TinyIconLineChart,
      iconClass: 'bg-green',
    },
    {
      title: '出站流量',
      value: formatBytes(statisticsStore.networkTraffic.outgoing || 0),
      icon: TinyIconLineChart,
      iconClass: 'bg-orange',
    },
  ];
});
console.log(statisticsCards.value, statistics);

// 生成模拟数据
const generateMockData = () => {
  const now = new Date();
  const timestamps: string[] = [];
  const users: number[] = [];
  const incomingTraffic: number[] = [];
  const outgoingTraffic: number[] = [];

  // 生成过去24小时的数据点，每小时一个点
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    timestamps.push(
      time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    );

    // 模拟在线用户数据：白天较多，晚上较少
    const hour = time.getHours();
    const baseUsers = 100; // 基础用户数
    const variation = Math.sin(((hour - 12) * Math.PI) / 12) * 50; // 日变化
    const randomFactor = Math.random() * 20 - 10; // 随机波动
    users.push(Math.max(0, Math.round(baseUsers + variation + randomFactor)));

    // 模拟流量数据：MB为单位，转换为字节
    const baseTraffic = 1024 * 1024 * (5 + Math.random() * 5); // 5-10MB基础流量
    const trafficVariation =
      Math.sin(((hour - 12) * Math.PI) / 12) * 1024 * 1024 * 3; // 日变化
    incomingTraffic.push(
      Math.max(0, Math.round(baseTraffic + trafficVariation)),
    );
    outgoingTraffic.push(
      Math.max(0, Math.round(baseTraffic * 0.7 + trafficVariation)),
    ); // 出站流量略小
  }

  return {
    timestamps,
    users,
    incomingTraffic,
    outgoingTraffic,
  };
};

// 使用模拟数据初始化
const mockData = generateMockData();
const historyData = ref({
  timestamps: mockData.timestamps,
  users: mockData.users,
  incomingTraffic: mockData.incomingTraffic,
  outgoingTraffic: mockData.outgoingTraffic,
});

// 图表配置
const userChartOptions = {
  tooltip: {
    trigger: 'axis',
    formatter: '{b}<br/>{a}: {c} 人',
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: historyData.value.timestamps,
    axisLabel: {
      interval: 2,
    },
  },
  yAxis: {
    type: 'value',
    name: '在线用户数',
    minInterval: 1,
    splitLine: {
      show: true,
      lineStyle: {
        type: 'dashed',
      },
    },
  },
  series: [
    {
      name: '在线用户',
      type: 'line',
      smooth: true,
      data: historyData.value.users,
      areaStyle: {
        opacity: 0.3,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64,158,255,0.8)' },
          { offset: 1, color: 'rgba(64,158,255,0.1)' },
        ]),
      },
      itemStyle: {
        color: '#409EFF',
      },
      lineStyle: {
        width: 2,
      },
    },
  ],
};

const trafficChartOptions = {
  tooltip: {
    trigger: 'axis',
    formatter: function (params: any[]) {
      return (
        params[0].axisValue +
        '<br/>' +
        params
          .map((param) => {
            return `${param.seriesName}: ${formatBytes(param.value)}`;
          })
          .join('<br/>')
      );
    },
  },
  legend: {
    data: ['入站流量', '出站流量'],
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: historyData.value.timestamps,
    axisLabel: {
      interval: 2,
    },
  },
  yAxis: {
    type: 'value',
    name: '流量',
    axisLabel: {
      formatter: (value: number) => formatBytes(value),
    },
    splitLine: {
      show: true,
      lineStyle: {
        type: 'dashed',
      },
    },
  },
  series: [
    {
      name: '入站流量',
      type: 'line',
      smooth: true,
      data: historyData.value.incomingTraffic,
      areaStyle: {
        opacity: 0.3,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(103,194,58,0.8)' },
          { offset: 1, color: 'rgba(103,194,58,0.1)' },
        ]),
      },
      itemStyle: {
        color: '#67C23A',
      },
      lineStyle: {
        width: 2,
      },
    },
    {
      name: '出站流量',
      type: 'line',
      smooth: true,
      data: historyData.value.outgoingTraffic,
      areaStyle: {
        opacity: 0.3,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(230,162,60,0.8)' },
          { offset: 1, color: 'rgba(230,162,60,0.1)' },
        ]),
      },
      itemStyle: {
        color: '#E6A23C',
      },
      lineStyle: {
        width: 2,
      },
    },
  ],
};

// 格式化字节数
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// 图表引用
const userChartRef = ref<HTMLElement | null>(null);
const trafficChartRef = ref<HTMLElement | null>(null);
let userChart: echarts.ECharts | null = null;
let trafficChart: echarts.ECharts | null = null;

// 初始化图表
const initCharts = () => {
  if (userChartRef.value && trafficChartRef.value) {
    // 销毁现有图表实例
    userChart?.dispose();
    trafficChart?.dispose();

    // 创建新的图表实例
    userChart = echarts.init(userChartRef.value);
    trafficChart = echarts.init(trafficChartRef.value);

    // 设置配置
    userChart.setOption(userChartOptions);
    trafficChart.setOption(trafficChartOptions);
  }
};

// 更新图表数据（模拟实时更新）
const updateCharts = () => {
  const mockUpdate = generateMockData();
  historyData.value = {
    timestamps: mockUpdate.timestamps,
    users: mockUpdate.users,
    incomingTraffic: mockUpdate.incomingTraffic,
    outgoingTraffic: mockUpdate.outgoingTraffic,
  };

  if (userChart && trafficChart) {
    userChart.setOption({
      xAxis: { data: historyData.value.timestamps },
      series: [{ data: historyData.value.users }],
    });

    trafficChart.setOption({
      xAxis: { data: historyData.value.timestamps },
      series: [
        { data: historyData.value.incomingTraffic },
        { data: historyData.value.outgoingTraffic },
      ],
    });
  }
};

// 监听窗口大小变化
const handleResize = () => {
  userChart?.resize();
  trafficChart?.resize();
};

let updateInterval: number;

onMounted(async () => {
  try {
    // 并行获取商品数据和统计数据
    await Promise.all([
      store.fetchProducts(),
      statisticsStore.fetchStatistics(),
    ]);

    // 开始定时更新统计数据
    statisticsStore.startPolling();

    // 初始化图表
    nextTick(() => {
      initCharts();
      // 开始定时更新图表数据
      updateInterval = window.setInterval(updateCharts, 30000);
      window.addEventListener('resize', handleResize);
    });
  } catch (error) {
    console.error('Failed to initialize dashboard:', error);
    TinyModal.message({
      message: '加载数据失败，请刷新页面重试',
      status: 'error',
    });
  }
});

onUnmounted(() => {
  clearInterval(updateInterval);
  window.removeEventListener('resize', handleResize);
  userChart?.dispose();
  trafficChart?.dispose();
});
</script>

<style scoped lang="less">
.dashboard-container {
  .stats-cards {
    display: flex;
    .stats-card {
      .stats-value {
        text-align: center;

        .number {
          font-size: 36px;
          font-weight: bold;
          color: #409eff;
        }

        .label {
          margin-left: 4px;
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }

  .system-stats {
    margin-bottom: 20px;
    display: flex;
  }

  .monitor-charts {
    display: flex;
    .chart {
      height: 400px;
      width: 100%;
    }
  }
}
:deep(.tiny-card) {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03);
}
.card-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  fill: #fff;
}

.bg-blue {
  background-color: #409eff;
}

.bg-green {
  background-color: #67c23a;
}

.bg-orange {
  background-color: #e6a23c;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  margin-bottom: 15px;
}
</style>
