<template>
  <div class="product-form-page">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑商品' : '添加商品' }}</h2>
    </div>

    <div class="page-content">
      <tiny-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="form-card"
        label-width="100px"
        @submit.prevent="handleSubmit"
      >
        <tiny-form-item label="商品名称" prop="name">
          <tiny-input v-model="form.name" placeholder="请输入商品名称" />
        </tiny-form-item>

        <tiny-form-item label="商品价格" prop="price">
          <tiny-numeric
            v-model="form.price"
            :min="0"
            :precision="2"
            :step="0.01"
            style="width: 200px"
          />
        </tiny-form-item>

        <tiny-form-item label="商品库存" prop="stock">
          <tiny-numeric
            v-model="form.stock"
            :min="0"
            :precision="0"
            style="width: 200px"
          />
        </tiny-form-item>

        <tiny-form-item label="商品分类" prop="category">
          <tiny-select v-model="form.category" placeholder="请选择商品分类">
            <tiny-option label="手机" value="phones" />
            <tiny-option label="笔记本" value="laptops" />
            <tiny-option label="平板" value="tablets" />
          </tiny-select>
        </tiny-form-item>

        <tiny-form-item label="商品状态" prop="status">
          <tiny-radio-group v-model="form.status">
            <tiny-radio label="on">上架</tiny-radio>
            <tiny-radio label="off">下架</tiny-radio>
          </tiny-radio-group>
        </tiny-form-item>

        <tiny-form-item label="商品图片" prop="image">
          <tiny-input v-model="form.image" placeholder="请输入商品图片URL" />
          <div class="image-preview" v-if="form.image" :z-index="3000">
            <tiny-image :src="form.image" :preview-src-list="[form.image]" />
          </div>
        </tiny-form-item>

        <tiny-form-item label="商品描述" prop="description">
          <tiny-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入商品描述"
          />
        </tiny-form-item>

        <tiny-form-item>
          <tiny-button
            type="primary"
            round
            native-type="submit"
            :loading="loading"
          >
            {{ isEdit ? '保存修改' : '添加商品' }}
          </tiny-button>
          <tiny-button round @click="$router.push('/products')"
            >取消</tiny-button
          >
        </tiny-form-item>
      </tiny-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  TinyForm,
  TinyFormItem,
  TinyAlert,
  TinyInput,
  TinyNumeric,
  TinySelect,
  TinyRadioGroup,
  TinyRadio,
  TinyButton,
  TinyCard,
  TinyOption,
  TinyModal,
  TinyImage,
} from '@opentiny/vue';
import { useStore } from '../store';
import type { ProductForm } from '../types';

const route = useRoute();
const router = useRouter();
const store = useStore();
const formRef = ref();

const isEdit = computed(() => route.name === 'EditProduct');
const productId = computed(() => Number(route.params.id));
const loading = computed(() => store.loading);
const error = computed(() => store.error);

const form = ref<ProductForm>({
  name: '',
  price: 0,
  description: '',
  image: 'https://picsum.photos/300/300',
  category: '',
  stock: 0,
  status: 'on',
});

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入商品价格', trigger: 'blur' }],
  category: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  stock: [{ required: true, message: '请输入商品库存', trigger: 'blur' }],
  image: [{ required: true, message: '请输入商品图片URL', trigger: 'blur' }],
  description: [{ required: true, message: '请输入商品描述', trigger: 'blur' }],
  status: [{ required: true, message: '请选择商品状态', trigger: 'change' }],
};

// 如果是编辑模式，获取商品详情
onMounted(async () => {
  if (isEdit.value) {
    await store.fetchProducts();
    const product = store.products.find((p) => p.id === productId.value);
    if (product) {
      form.value = {
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.image,
        category: product.category,
        stock: product.stock,
        status: product.status,
      };
    } else {
      TinyModal.message({ message: '商品不存在', status: 'error' });
      router.push('/products');
    }
  }
});

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      let success;
      if (isEdit.value) {
        success = await store.updateProduct(productId.value, form.value);
      } else {
        success = await store.addProduct(form.value);
      }

      if (success) {
        // 重新获取商品列表
        await store.fetchProducts();
        TinyModal.message({
          message: isEdit.value ? '更新成功' : '添加成功',
          status: 'success',
        });
        router.push('/products');
      }
    }
  });
};
</script>

<style scoped lang="less">
.product-form-page {
  .page-header {
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }
  }
}

.page-content {
  padding: 20px;
  margin-right: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03);
}

.form-card {
  max-width: 800px;
}

.image-preview {
  margin-top: 8px;
  width: 200px;
  height: 200px;
  border-radius: 4px;
  overflow: hidden;

  :deep(.tiny-image) {
    width: 100%;
    height: 100%;
  }
}
</style>
