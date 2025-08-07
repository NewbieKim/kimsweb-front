import type { EChartsOption } from 'echarts';
import type { Ref } from 'vue';
// import { tryOnUnmounted } from '@vueuse/core';
import { unref, nextTick, watch, computed, ref } from 'vue';
import echarts from '@/utils/lib/echarts';