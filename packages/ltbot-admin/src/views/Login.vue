<template>
  <div class="login-page">
    <tiny-card class="login-card">
      <template #header>
        <h2 class="login-title">商品管理系统</h2>
      </template>

      <tiny-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="0"
        @submit.prevent="handleLogin"
      >
        <tiny-form-item prop="username">
          <tiny-input
            v-model="form.username"
            placeholder="用户名"
            prefix-icon="user"
          />
        </tiny-form-item>

        <tiny-form-item prop="password">
          <tiny-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            prefix-icon="lock"
            show-password
          />
        </tiny-form-item>

        <tiny-form-item>
          <tiny-button
            type="danger"
            native-type="submit"
            :loading="loading"
            style="width: 100%"
          >
            登录
          </tiny-button>
        </tiny-form-item>
      </tiny-form>
    </tiny-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { TinyMessage } from '@opentiny/vue';
import { useStore } from '../store';

const router = useRouter();
const store = useStore();
const formRef = ref();
const loading = ref(false);

const form = ref({
  username: '',
  password: '',
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

const handleLogin = async () => {
  if (!formRef.value) return;

  try {
    loading.value = true;
    await formRef.value.validate();

    if (store.login(form.value.username, form.value.password)) {
      TinyMessage.success('登录成功');
      router.push('/');
    } else {
      TinyMessage.error('用户名或密码错误');
    }
  } catch (error) {
    console.error('Form validation error:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="less">
.login-page {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-title {
  margin: 0;
  text-align: center;
  font-size: 24px;
  font-weight: 500;
}
</style>
