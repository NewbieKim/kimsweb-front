import { defineStore } from 'pinia';
import type { User, Product } from '../types';

// 后端API基础URL
const API_BASE_URL = '/api';

interface State {
  user: User | null;
  products: Product[];
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
}

export const useStore = defineStore('main', {
  state: (): State => ({
    user: null,
    products: [],
    isLoggedIn: false,
    loading: false,
    error: null
  }),

  actions: {
    // 获取商品列表
    async fetchProducts() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_BASE_URL}/products-all`);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const result = await response.json();
        if (result.success) {
          this.products = result.data;
        } else {
          throw new Error(result.message || 'Failed to fetch products');
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error';
      } finally {
        this.loading = false;
      }
    },

    // 添加商品
    async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_BASE_URL}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(product)
        });

        if (!response.ok) {
          throw new Error('Failed to add product');
        }

        const result = await response.json();
        if (result.success) {
          this.products.push(result.data);
          return true;
        } else {
          throw new Error(result.message || 'Failed to add product');
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        return false;
      } finally {
        this.loading = false;
      }
    },

    // 更新商品
    async updateProduct(id: number, product: Partial<Product>) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(product)
        });

        if (!response.ok) {
          throw new Error('Failed to update product');
        }

        const result = await response.json();
        if (result.success) {
          const index = this.products.findIndex((p) => p.id === id);
          if (index > -1) {
            this.products[index] = result.data;
          }
          return true;
        } else {
          throw new Error(result.message || 'Failed to update product');
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        return false;
      } finally {
        this.loading = false;
      }
    },

    // 删除商品
    async deleteProduct(id: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete product');
        }

        const result = await response.json();
        if (result.success) {
          const index = this.products.findIndex((p) => p.id === id);
          if (index > -1) {
            this.products.splice(index, 1);
          }
          return true;
        } else {
          throw new Error(result.message || 'Failed to delete product');
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        return false;
      } finally {
        this.loading = false;
      }
    },

    // 登录
    login(username: string, password: string) {
      // 模拟登录，实际项目中需要调用API
      if (username === 'admin' && password === 'admin') {
        this.user = {
          id: 1,
          username: 'admin',
          avatar: 'https://picsum.photos/100/100'
        };
        this.isLoggedIn = true;
        return true;
      }
      return false;
    },

    // 登出
    logout() {
      this.user = null;
      this.isLoggedIn = false;
    }
  },

  getters: {
    // 获取商品总数
    productCount: (state) => state.products.length,

    // 获取上架商品数量
    activeProductCount: (state) =>
      state.products.filter((p) => p.status === 'on').length,

    // 获取所有上架商品
    activeProducts: (state) => state.products.filter((p) => p.status === 'on')
  }
});
