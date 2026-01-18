<template>
  <van-cell style="padding: 0">
    <template v-for="item in computedConfig" :key="item.key">
      <!-- 普通输入框 -->
      <van-field
        v-if="!item.is || item.is === 'van-field'"
        :label="item.label"
        :model-value="modelValue[item.key]"
        :type="item.type || 'text'"
        :placeholder="item.placeholder || '请输入'"
        :required="isRequired(item)"
        :disabled="!edit || item.disabled"
        :readonly="item.readonly"
        :rules="item.rules"
        :input-align="item.inputAlign || 'right'"
        @update:model-value="handleInput(item.key, $event, item)"
        @change="handleChange($event, item)"
      >
        <template #extra v-if="item.unit">
          <span>{{
            typeof item.unit === "function" ? item.unit(modelValue) : item.unit
          }}</span>
        </template>
      </van-field>

      <!-- 选择器 -->
      <van-field
        v-else-if="item.is === 'van-field-picker'"
        readonly
        clickable
        :label="item.label"
        :model-value="getPickerText(item)"
        :placeholder="item.placeholder || '请选择'"
        :required="isRequired(item)"
        :disabled="!edit || item.disabled"
        :rules="item.rules"
        :input-align="item.inputAlign || 'right'"
        :right-icon="edit && !item.disabled ? 'arrow' : ''"
        @click="openPicker(item)"
      />
    </template>

    <!-- 选择器弹窗 -->
    <template v-for="item in computedConfig" :key="'popup-' + item.key">
      <van-popup
        v-if="item.is === 'van-field-picker'"
        v-model:show="pickerVisible[item.key]"
        position="bottom"
        round
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
  </van-cell>
</template>

<script setup>
/**
 * g-forms 组件 - Vue 3 版本
 * 对应原 guotai/src/gt/form/forms.vue
 *
 * 功能：
 * 1. 配置驱动表单渲染
 * 2. 动态隐藏字段 (hide)
 * 3. 动态必填校验 (rules.required 支持函数)
 * 4. 字段联动 (change)
 * 5. 异步列加载 (columns 支持函数)
 * 6. 自动回填 (setKey)
 */
import { ref, computed, toRef } from "vue";
import { useFormCommon } from "../utils/useFormCommon";
import { vSetData } from "../utils/directive";

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  config: {
    type: Array,
    default: () => [],
  },
  edit: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue", "setdata"]);

// 使用公共逻辑
const { tempConfig, allChange, itemInput } = useFormCommon(
  toRef(props, "config"),
  toRef(props, "modelValue"),
);

// 选择器显示状态
const pickerVisible = ref({});
const currentPickerItem = ref(null);

/**
 * 计算后的配置
 * 处理动态隐藏、动态规则等
 */
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

      // 处理动态 label
      if (typeof processed.label === "function") {
        processed.label = processed.label(props.modelValue, processed);
      }

      // 处理多 change 监听数组
      if (Array.isArray(processed.change)) {
        const fns = [...processed.change];
        processed.change = function (...args) {
          fns.forEach((fn) => fn.apply(this, args));
        };
      }

      // 处理规则中的动态 required
      processed.rules = (processed.rules || []).map((rule) => {
        const newRule = { ...rule };

        // 动态 required
        if (typeof newRule.required === "function") {
          newRule.required = newRule.required(props.modelValue[processed.key], {
            values: props.modelValue,
            message: newRule.message,
            name: processed.label,
          });
        }

        return {
          ...newRule,
          values: props.modelValue,
        };
      });

      // 占位符
      if (!props.edit) {
        processed.placeholder = "-";
      }

      return processed;
    })
    .filter((item) => !item.c_hide);
});

/**
 * 输入变化处理
 */
const handleInput = (key, val, item) => {
  const newValue = {
    ...props.modelValue,
    [key]: val,
  };
  itemInput(newValue);
  emit("update:modelValue", newValue);
};

/**
 * 变化处理
 */
const handleChange = (e, item) => {
  allChange(e, item.change, item, props.modelValue);
};

/**
 * 打开选择器
 */
const openPicker = (item) => {
  if (!props.edit || item.disabled) return;
  currentPickerItem.value = item;
  pickerVisible.value[item.key] = true;
};

/**
 * 选择器确认
 */
const onPickerConfirm = (item, { selectedOptions }) => {
  const selected = selectedOptions[0] || {};
  const valueKey = item.valueKey || "value";
  const newVal = selected[valueKey];

  // 更新值
  const newValue = {
    ...props.modelValue,
    [item.key]: newVal,
  };

  // 处理 setKey 自动回填
  if (item.setKey) {
    vSetData(item.setKey, newValue, selected);
  }

  emit("update:modelValue", newValue);
  pickerVisible.value[item.key] = false;

  // 触发 change 回调
  allChange(newVal, item.change, item, newValue);

  // 触发 setdata 事件
  emit("setdata", selected);
};

/**
 * 获取选择器显示文本
 */
const getPickerText = (item) => {
  const columns = item.columns || [];
  const currentVal = props.modelValue[item.key];
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
</script>
