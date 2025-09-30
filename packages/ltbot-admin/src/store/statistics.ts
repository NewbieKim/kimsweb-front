import { defineStore } from 'pinia';

interface Statistics {
  onlineUsers: number;
  networkTraffic: {
    incoming: number; // in bytes
    outgoing: number; // in bytes
  };
  lastUpdated: string;
}

export const useStatisticsStore = defineStore('statistics', {
  state: (): Statistics => ({
    onlineUsers: 0,
    networkTraffic: {
      incoming: 0,
      outgoing: 0
    },
    lastUpdated: new Date().toISOString()
  }),

  actions: {
    async fetchStatistics() {
      try {
        const response = await fetch('/api/statistics');
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }
        const result = await response.json();
        if (result.success && result.data) {
          this.onlineUsers = result.data.onlineUsers;
          this.networkTraffic = result.data.networkTraffic;
          this.lastUpdated = result.data.timestamp;
          return true;
        }
        throw new Error('Invalid response format');
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
        return false;
      }
    },

    startPolling() {
      // 清除可能存在的旧定时器
      if (window._statisticsTimer) {
        clearInterval(window._statisticsTimer);
      }

      // 创建新的定时器
      window._statisticsTimer = setInterval(async () => {
        const success = await this.fetchStatistics();
        if (!success) {
          // 如果获取失败，等待5秒后重试一次
          setTimeout(async () => {
            await this.fetchStatistics();
          }, 5000);
        }
      }, 30000);

      // 添加类型声明
      declare global {
        interface Window {
          _statisticsTimer: number;
        }
      }
    }
  },

  getters: {
    formattedTraffic: (state) => {
      const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
      };

      return {
        incoming: formatBytes(state.networkTraffic.incoming),
        outgoing: formatBytes(state.networkTraffic.outgoing)
      };
    }
  }
});
