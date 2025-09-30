<template>
  <div class="products-page">
    <div class="page-header">
      <h3>商品管理</h3>
    </div>
    <div class="page-content">
      <div class="button-box">
        <div class="button-box-left">
          <tiny-input
            v-model="searchQuery"
            placeholder="搜索商品名称"
            clearable
          />
          <tiny-select v-model="statusFilter" placeholder="商品状态" clearable>
            <tiny-option label="上架" value="on" />
            <tiny-option label="下架" value="off" />
          </tiny-select>
          <tiny-select
            v-model="categoryFilter"
            placeholder="商品分类"
            clearable
          >
            <tiny-option label="手机" value="phones" />
            <tiny-option label="笔记本" value="laptops" />
            <tiny-option label="平板" value="tablets" />
          </tiny-select>
        </div>
        <tiny-button
          type="primary"
          class="button-box-right"
          round
          @click="$router.push('/products/add')"
        >
          添加商品
        </tiny-button>
      </div>
      <tiny-grid
        :data="
          filteredProducts.slice(
            (custPager.currentPage - 1) * custPager.pageSize,
            custPager.currentPage * custPager.pageSize,
          )
        "
        height="560"
        style="width: 100%"
      >
        <tiny-grid-column title="商品图片" width="100">
          <template #default="{ row }">
            <tiny-image
              :src="row.image"
              :preview-src-list="[row.image]"
              class="product-image"
            />
          </template>
        </tiny-grid-column>

        <tiny-grid-column field="name" title="商品名称" />
        <tiny-grid-column field="price" title="价格">
          <template #default="{ row }"> ¥{{ row.price }} </template>
        </tiny-grid-column>
        <tiny-grid-column field="stock" title="库存" />
        <tiny-grid-column field="category" title="分类">
          <template #default="{ row }">
            {{ categoryLabels[row.category] }}
          </template>
        </tiny-grid-column>
        <tiny-grid-column field="status" title="状态">
          <template #default="{ row }">
            <tiny-tag :type="row.status === 'on' ? 'success' : 'warning'">
              {{ row.status === 'on' ? '上架' : '下架' }}
            </tiny-tag>
          </template>
        </tiny-grid-column>

        <tiny-grid-column title="操作" width="200" fixed="right">
          <template #default="{ row }">
            <tiny-button-group>
              <tiny-button
                type="info"
                size="mini"
                round
                plain
                @click="$router.push(`/products/edit/${row.id}`)"
              >
                <template #icon>
                  <tiny-icon name="edit" />
                </template>
                编辑
              </tiny-button>
              <tiny-button
                type="danger"
                size="mini"
                round
                plain
                @click="handleDelete(row)"
              >
                <template #icon>
                  <tiny-icon name="delete" />
                </template>
                删除
              </tiny-button>
            </tiny-button-group>
          </template>
        </tiny-grid-column>
      </tiny-grid>
      <tiny-pager
        :current-page="custPager.currentPage"
        :page-size="custPager.pageSize"
        :total="filteredProducts.length"
        :page-sizes="[5, 10, 20, 50]"
        @current-change="currentChange"
        @size-change="sizeChange"
        layout="total, sizes, prev, pager, next, jumper"
      ></tiny-pager>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
import { WebMcpServer, z } from '@opentiny/next-sdk';
import {
  TinyImage,
  TinyButtonGroup,
  TinyModal,
  TinyInput,
  TinySelect,
  TinyGrid,
  TinyGridColumn,
  TinyButton,
  TinyOption,
  TinyTag,
  TinyNotify,
  TinyPager,
} from '@opentiny/vue';
import { useStore } from '../store';
import type { Product } from '../types';

const store = useStore();
const searchQuery = ref('');
const statusFilter = ref('');
const categoryFilter = ref('');
const custPager = ref({
  currentPage: 1,
  pageSize: 10,
});

const loading = computed(() => store.loading);
const error = computed(() => store.error);

const serverTransport = inject('serverTransport')
const server = new WebMcpServer()

function currentChange(current) {
  custPager.value.currentPage = current;
}

function sizeChange(size) {
  custPager.value.pageSize = size;
}

// 组件挂载时获取商品列表
onMounted(async () => {
  await store.fetchProducts();
  await server.connect(serverTransport)
});

const categoryLabels: Record<string, string> = {
  phones: '手机',
  laptops: '笔记本',
  tablets: '平板',
};

// 过滤商品列表
const filteredProducts = computed(() => {
  let data = store.products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase());
    const matchesStatus =
      !statusFilter.value || product.status === statusFilter.value;
    const matchesCategory =
      !categoryFilter.value || product.category === categoryFilter.value;
    return matchesSearch && matchesStatus && matchesCategory;
  });
  return data;
});

// 处理删除商品
const handleDelete = async (product: Product) => {
  TinyModal.confirm({
    message: `您确定要删除商品 "${product.name}" 吗？`,
    title: '删除商品',
    status: 'warning',
    events: {
      async confirm(ev) {
        const success = await store.deleteProduct(product.id);
        if (success) {
          TinyModal.message({
            message: '删除成功',
            status: 'success',
          });
        } else {
          TinyModal.message({
            message: '删除失败',
            status: 'error',
          });
        }
      },
    },
  });
};

server.registerTool(
  'add-product',
  {
    description: '添加商品',
    inputSchema: {
      id: z.number().describe('商品ID'),
      name: z.string().describe('商品名称'),
      price: z.number().describe('商品价格'),
      description: z.string().describe('商品描述'),
      image: z.string().describe('商品图片URL'),
      category: z.string().describe('商品分类, 例如：手机、笔记本、平板'),
      stock: z.number().describe('商品库存，数量'),
      status: z.enum(['on', 'off']).describe('商品状态，on为上架，off为下架')
    }
  },
  async (productData: any) => {
    // 显示添加商品弹窗并填充数据
    productData.id = productData.id || new Date().getTime()
    const success = await store.addProduct(productData)

    return {
      content: [
        {
          type: 'text',
          text: `商品数据: ${productData.name}，价格: ${productData.price}，库存: ${productData.stock}`
        }
      ]
    }
  }
)

</script>

<style scoped lang="less">
.products-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    height: 32px;
  }
}

.button-box {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  justify-content: space-between;
}
.button-box-left {
  display: flex;
  gap: 8px;
}

.loading-state {
  padding: 20px;
}

.product-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
}
.page-content {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03);
}
</style>
