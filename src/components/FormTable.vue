<template>
  <div style="width: 100%">
    <!-- 标题行 + 添加按钮 -->
    <van-field
      disabled
      :model-value="displayValue"
      :required="required"
      :rules="rules"
    >
      <template #label>
        <span>{{ label }}</span>
      </template>
      <template #input>
        <div
          v-if="!disabled"
          style="flex: 1; display: flex; justify-content: flex-end"
        >
          <van-button
            v-if="!disabledAdd && maxCount > modelValue.length"
            type="primary"
            plain
            round
            size="mini"
            style="padding: 0 12px"
            @click="addItem"
          >
            +添加
          </van-button>
        </div>
      </template>
    </van-field>

    <!-- 表格 -->
    <van-cell style="padding-top: 0">
      <AVanTable
        :headers="headers"
        :model-value="modelValue"
        :show-bottom-sum="configObj.showBottomSum"
      >
        <template #operating="{ value: row, index }">
          <div>
            <van-icon
              name="edit"
              class="action-icon"
              @click="editItem(row, index)"
            />
            <van-icon
              v-if="!disabledAdd"
              name="delete-o"
              class="action-icon"
              @click="delItem(index)"
            />
          </div>
        </template>
      </AVanTable>
    </van-cell>

    <!-- 编辑弹窗 -->
    <van-popup
      v-model:show="popupVisible"
      position="bottom"
      round
      closeable
      :style="{ height: '80vh' }"
    >
      <div class="popup-form">
        <h3>{{ tempEdit.__add ? "添加" : "编辑" }}{{ label }}</h3>

        <van-form @submit="editOk" label-width="auto">
          <template v-for="item in computedConfig" :key="item.key">
            <!-- 普通输入框 -->
            <van-field
              v-if="!item.is || item.is === 'van-field'"
              :label="item.label"
              v-model="tempEdit[item.key]"
              :type="item.type || 'text'"
              :placeholder="item.placeholder || '请输入'"
              :required="isRequired(item)"
              :disabled="isDisabled(item)"
              :readonly="item.readonly"
              :rules="item.rules"
              input-align="right"
              @update:model-value="handleFieldInput(item.key, $event, item)"
              @change="handleChange($event, item)"
            />

            <!-- 选择器 -->
            <van-field
              v-else-if="item.is === 'van-field-picker'"
              readonly
              clickable
              :label="item.label"
              :model-value="getPickerText(item)"
              :placeholder="item.placeholder || '请选择'"
              :required="isRequired(item)"
              :disabled="isDisabled(item)"
              :rules="item.rules"
              input-align="right"
              :right-icon="!isDisabled(item) ? 'arrow' : ''"
              @click="openPicker(item)"
            />
          </template>

          <!-- 提交按钮 -->
          <div style="padding: 16px">
            <van-button type="primary" block round native-type="submit">
              {{ tempEdit.__add ? "添加" : "确认修改" }}
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 选择器弹窗 -->
    <template v-for="item in computedConfig" :key="'picker-' + item.key">
      <van-popup
        v-if="item.is === 'van-field-picker'"
        v-model:show="pickerVisible[item.key]"
        position="bottom"
      >
        <van-picker
          :columns="item.columns || []"
          :columns-field-names="{
            text: item.textKey || 'text',
            value: item.valueKey || 'value',
          }"
          @confirm="onPickerConfirm(item, $event)"
          @cancel="pickerVisible[item.key] = false"
        />
      </van-popup>
    </template>
  </div>
</template>

<script setup>
/**
 * form-table 组件 - Vue 3 版本
 * 对应原 guotai/src/gt/form/formTable.vue
 *
 * 功能：
 * 1. 表格内嵌表单 - 支持增删改行数据
 * 2. 弹窗编辑 - 点击添加/编辑时弹出表单
 * 3. 配置驱动 - 通过 config 配置字段、类型、校验
 * 4. 自动合计 - totalKey 配置自动计算合计值
 * 5. 防重校验 - only 配置防止重复添加
 * 6. 动态隐藏 - hide 支持函数
 * 7. setKey 自动回填
 * 8. v-models 批量更新 (inputs 事件)
 */
import { ref, computed, watch, toRef } from "vue";
import { showToast, showConfirmDialog } from "vant";
import AVanTable from "./AVanTable.vue";
import { useFormCommon } from "../utils/useFormCommon";
import { vSetData } from "../utils/directive";

const props = defineProps({
  label: {
    type: String,
    default: "明细数据",
  },
  config: {
    type: [Object, Array],
    default: () => ({ columns: [] }),
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
  values: {
    type: Object,
    default: () => ({}),
  },
  allEdit: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  disabledAdd: {
    type: Boolean,
    default: false,
  },
  maxLength: {
    type: Number,
    default: 0,
  },
  rules: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "inputs", "open"]);

// 配置对象（兼容数组和对象格式）
const configObj = computed(() => {
  return Array.isArray(props.config) ? {} : props.config;
});

// 使用公共逻辑
const { tempConfig, allChange, itemInput } = useFormCommon(
  toRef(props, "config"),
  toRef(props, "modelValue"),
);

// 状态
const popupVisible = ref(false);
const tempEdit = ref({}); // 临时编辑对象
const tempIndex = ref(-1); // 编辑索引
const pickerVisible = ref({}); // 选择器显示状态

// 最大条数
const maxCount = computed(() => props.maxLength || 9999);

// 是否必填
const required = computed(() => {
  return (props.rules || []).some((rule) => rule.required);
});

// 显示值（有数据显示-，无数据为空）
const displayValue = computed(() => {
  return props.modelValue && props.modelValue.length ? "-" : "";
});

// 处理后的配置（用于弹窗表单）
const computedConfig = computed(() => {
  return (tempConfig.value || [])
    .map((item) => {
      const processed = { ...item };

      // 处理动态隐藏
      if (typeof processed.hide === "function") {
        processed.c_hide = processed.hide(props.modelValue, processed);
      } else {
        processed.c_hide = processed.hide;
      }

      // 处理异步列
      if (typeof processed.columns === "function") {
        processed.columns = [];
      }

      // 处理多 change 监听
      if (Array.isArray(processed.change)) {
        const fns = [...processed.change];
        processed.change = function (...args) {
          fns.forEach((fn) => fn.apply(this, args));
        };
      }

      // 处理规则
      processed.rules = (processed.rules || []).map((rule) => {
        const newRule = { ...rule };
        if (newRule.required && newRule.message) {
          newRule.message = processed.label + "-" + newRule.message;
        }
        return {
          ...newRule,
          values: tempEdit.value,
        };
      });

      return processed;
    })
    .filter((item) => !item.c_hide);
});

// 表格头配置
const headers = computed(() => {
  return [
    { type: "index", label: "序号", width: "15%" },
    ...computedConfig.value.filter((item) => !item.table_hide),
    ...(props.disabled
      ? []
      : [{ label: "操作", slot: "operating", width: "20%" }]),
  ];
});

// 监听数据变化，计算合计
watch(
  () => props.modelValue,
  (v) => {
    if (!Array.isArray(v)) {
      emit("update:modelValue", []);
      return;
    }

    // 处理 totalKey 合计
    const { totalKey } = configObj.value;

    if (totalKey && typeof totalKey === "string") {
      const totals = { ...props.values };

      totalKey
        .replace(/\s+/g, "")
        .split(",")
        .forEach((item) => {
          const [targetKey, sourceKey] = item.split("|");
          const key = sourceKey || targetKey;
          totals[targetKey] =
            Math.round(
              v.reduce((sum, row) => sum + (parseFloat(row[key]) || 0), 0) *
                100,
            ) / 100;
        });

      emit("inputs", totals);
    }
  },
  { immediate: true },
);

/**
 * 添加项
 */
const addItem = () => {
  if (props.modelValue.length >= maxCount.value) {
    showToast(`最多添加${maxCount.value}条`);
    return;
  }
  tempIndex.value = props.modelValue.length;
  tempEdit.value = { __add: true };
  popupVisible.value = true;
  emit("open");
};

/**
 * 编辑项
 */
const editItem = (row, index) => {
  tempIndex.value = index;
  tempEdit.value = { ...row };
  popupVisible.value = true;
  emit("open");
};

/**
 * 删除项
 */
const delItem = (index) => {
  showConfirmDialog({
    title: "确认删除",
    message: "确定要删除这条数据吗？",
  })
    .then(() => {
      const newValue = [...props.modelValue];
      newValue.splice(index, 1);
      emit("update:modelValue", newValue);
    })
    .catch(() => {});
};

/**
 * 编辑确认
 */
const editOk = () => {
  delete tempEdit.value.__add;
  let newValue = [...props.modelValue];
  newValue.splice(tempIndex.value, 1, { ...tempEdit.value });

  // 防重校验
  const { only } = configObj.value;

  if (only) {
    const unique = {};
    const deduped = [];
    newValue.forEach((item) => {
      if (!unique[item[only]]) {
        unique[item[only]] = true;
        deduped.push(item);
      }
    });

    if (deduped.length < newValue.length) {
      showToast("不能重复添加");
    }
    newValue = deduped;
  }

  emit("update:modelValue", newValue);
  popupVisible.value = false;
};

/**
 * 字段输入处理
 */
const handleFieldInput = (key, val, item) => {
  tempEdit.value[key] = val;
  itemInput(tempEdit.value);
};

/**
 * 变化处理
 */
const handleChange = (e, item) => {
  allChange(e, item.change, item, tempEdit.value);
};

/**
 * 打开选择器
 */
const openPicker = (item) => {
  if (isDisabled(item)) return;
  pickerVisible.value[item.key] = true;
};

/**
 * 选择器确认
 */
const onPickerConfirm = (item, { selectedOptions }) => {
  const selected = selectedOptions[0] || {};
  const valueKey = item.valueKey || "value";
  tempEdit.value[item.key] = selected[valueKey];

  // 处理 setKey
  if (item.setKey) {
    vSetData(item.setKey, tempEdit.value, selected);
  }

  pickerVisible.value[item.key] = false;
  allChange(selected[valueKey], item.change, item, tempEdit.value);
};

/**
 * 获取选择器显示文本
 */
const getPickerText = (item) => {
  const columns = item.columns || [];
  const currentVal = tempEdit.value[item.key];
  const valueKey = item.valueKey || "value";
  const textKey = item.textKey || "text";

  const matched = columns.find((col) => col[valueKey] === currentVal);
  return matched ? matched[textKey] : "";
};

/**
 * 判断是否必填
 */
const isRequired = (item) => {
  return (item.rules || []).some((rule) => rule.required);
};

/**
 * 是否禁用编辑
 */
const isDisabled = (item) => {
  return item.disabled || !(item.edit !== false && props.allEdit);
};
</script>

<style scoped>
.popup-form {
  padding: 16px;
}

.popup-form h3 {
  text-align: center;
  margin-bottom: 16px;
  padding-top: 8px;
}

.action-icon {
  color: #ee0a24;
  font-size: 18px;
  margin: 0 4px;
  cursor: pointer;
}
</style>
