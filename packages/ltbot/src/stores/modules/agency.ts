import { defineStore } from 'pinia';
import type { Agency } from '../types';

// 后端API基础URL
const API_BASE_URL = '/api';

interface State {
  agencies: Agency[];
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
}

// 定义待办事项存储模块
export const useAgencyStore = defineStore('agency', {
  state: (): State => ({
    agencies: [] as Agency[],
    isLoggedIn: false,
    loading: false,
    error: null
  }),
  actions: {
    async fetchAgencies() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_BASE_URL}/agencies`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.agencies = data.data || [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error';
      } finally {
        this.loading = false;
      }
    },
    
    async deleteAgency(id: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_BASE_URL}/agencies/${id}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // 从本地状态中移除已删除的代办
        this.agencies = this.agencies.filter(agency => agency.id !== id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        throw error; // 重新抛出错误以便组件处理
      } finally {
        this.loading = false;
      }
    },
    
    async createAgency(agencyData: Omit<Agency, 'id' | 'createdAt' | 'updatedAt'>) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_BASE_URL}/agencies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(agencyData)
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newAgency = await response.json();
        // 将新创建的代办添加到本地状态的开头
        this.agencies.unshift(newAgency.data || newAgency);
        return newAgency;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        throw error; // 重新抛出错误以便组件处理
      } finally {
        this.loading = false;
      }
    }
  }
})
