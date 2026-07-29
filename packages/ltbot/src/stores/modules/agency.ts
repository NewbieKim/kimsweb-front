import { defineStore } from 'pinia';
import type { Agency } from '@/types';

// 后端API基础URL
//const API_BASE_URL = '/api';
const LOCALURL = 'http://localhost:6688/api'
const PRODURL = 'https://ltbot.top/api' // ltbot.top
const API_BASE_URL = process.env.NODE_ENV === 'production' ? PRODURL : LOCALURL
// export const userApi = {
//   agencies: API_BASE_URL + 'agencies',
//   deleteAgency: API_BASE_URL + 'agencies',
//   createAgency: API_BASE_URL + 'agencies',
// }

interface State {
  agencies: Agency[];
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
}

type AgencyId = string | number
type AgencyCreatePayload = Pick<Agency, 'title' | 'description' | 'status' | 'priority'>
type AgencyUpdatePayload = Partial<Pick<Agency, 'title' | 'description' | 'status' | 'priority'>>

function getAgencyId(agency: Agency): AgencyId | undefined {
  return agency.entityId || agency.id
}

async function parseApiError(response: Response) {
  try {
    const result = await response.json()
    return result.message || `HTTP error! status: ${response.status}`
  } catch {
    return `HTTP error! status: ${response.status}`
  }
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
        const response = await fetch(`${API_BASE_URL}/agencies`,{
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
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
    
    async deleteAgency(id: AgencyId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_BASE_URL}/agencies/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error(await parseApiError(response));
        }
        // 从本地状态中移除已删除的代办
        this.agencies = this.agencies.filter(agency => getAgencyId(agency) !== id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        throw error; // 重新抛出错误以便组件处理
      } finally {
        this.loading = false;
      }
    },
    
    async createAgency(agencyData: AgencyCreatePayload) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_BASE_URL}/agencies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(agencyData)
        });
        if (!response.ok) {
          throw new Error(await parseApiError(response));
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
    },

    async updateAgency(id: AgencyId, agencyData: AgencyUpdatePayload) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_BASE_URL}/agencies/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(agencyData)
        });
        if (!response.ok) {
          throw new Error(await parseApiError(response));
        }
        const result = await response.json();
        const updatedAgency = result.data || result;
        this.agencies = this.agencies.map(agency => (
          getAgencyId(agency) === id ? updatedAgency : agency
        ));
        return updatedAgency;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
})
