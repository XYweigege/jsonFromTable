<template>
  <div class="auto-table-box">
    <table class="auto-table">
      <!-- 表头 -->
      <tr>
        <th
          v-for="col in headersList"
          :key="col.key || col.label"
          :style="{ width: col.width || 100 / headersList.length + '%' }"
        >
          {{ col.title || col.label }}
        </th>
      </tr>

      <!-- 数据行 -->
      <tr v-for="(row, index) in modelValue" :key="index">
        <td
          v-for="col in headersList"
          :key="col.key || col.label"
          :style="{ width: col.width }"
        >
          <!-- 序号列 -->
          <template v-if="col.type === 'index'">{{ index + 1 }}</template>

          <!-- 自定义插槽 -->
          <slot
            v-else-if="col.slot"
            :name="col.slot"
            :row="col"
            :value="row"
            :index="index"
          >
            {{ getCellValue(row, col) }}
          </slot>

          <!-- 普通数据 -->
          <template v-else>{{ getCellValue(row, col) }}</template>
        </td>
      </tr>

      <!-- 合计行 -->
      <tr v-if="showBottomSum && modelValue.length">
        <th
          v-for="(col, index) in headersList"
          :key="'sum-' + (col.key || index)"
        >
          <template v-if="col.type === 'index'">合计</template>
          <template v-else-if="col.total !== undefined"
            >{{ col.total }}{{ col.unit || "" }}</template
          >
          <template v-else>-</template>
        </th>
      </tr>
    </table>

    <!-- 空状态 -->
    <div v-if="!modelValue.length" class="empty-tip">
      <van-empty image="search" description="暂无数据" />
    </div>
  </div>
</template>

<script setup>
/**
 * a-van-table 组件 - Vue 3 版本
 * 对应原 guotai/src/gt/a-van-table/a-van-table.vue
 *
 * 功能：
 * 1. 表格数据渲染
 * 2. 自动计算合计行
 * 3. 支持插槽自定义渲染
 * 4. 序号列、操作列
 */
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  headers: {
    type: Array,
    default: () => [],
  },
  showBottomSum: {
    type: Boolean,
    default: false,
  },
  scroll: {
    type: Boolean,
    default: false,
  },
});

// 处理表头配置
const headersList = computed(() => {
  return props.headers
    .filter((col) => !col.table_hide)
    .map((col) => {
      const newCol = { ...col };
      // 计算合计
      if (col.key && !col.type) {
        newCol.total = 0;
        props.modelValue.forEach((row) => {
          newCol.total =
            Math.round((newCol.total + (parseFloat(row[col.key]) || 0)) * 100) /
            100;
        });
      }
      return newCol;
    });
});

// 获取单元格显示值
const getCellValue = (row, col) => {
  const value = row[col.key];
  // 添加单位
  const unit = typeof col.unit === "function" ? col.unit(row) : col.unit || "";
  return value !== undefined && value !== null && value !== ""
    ? value + unit
    : "-";
};
</script>

<style scoped>
.auto-table-box {
  width: 100%;
  overflow: hidden;
  overflow-x: auto;
}

.auto-table {
  border-spacing: 0;
  border-collapse: collapse;
  text-align: center;
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 12px;
}

.auto-table tr {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.auto-table td,
.auto-table th {
  padding: 8px 4px;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  line-height: 1.4;
}

.auto-table th {
  background-color: #eaeef1;
  font-weight: 500;
}

.empty-tip {
  text-align: center;
  color: #969799;
  padding: 20px 0;
}
</style>
