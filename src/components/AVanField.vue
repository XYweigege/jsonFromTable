<template>
  <van-field
    v-bind="config"
    :type="config.type || 'text'"
    :required="required"
    :label="labelText"
    :disabled="disabled"
    :model-value="showValue"
    :placeholder="config.placeholder || placeholder"
    :input-align="inputAlign"
    :name="config.key"
    :rules="rulesConfig"
    :readonly="config.readonly"
    @update:model-value="handleInput"
    @change="handleChange"
  >
    <template #extra v-if="unit">
      <span style="margin-left: 4px">{{ unit }}</span>
    </template>
    <slot name="component"></slot>
  </van-field>
</template>

<script setup>
/**
 * a-van-field 组件 - Vue 3 版本
 * 对应原 guotai/src/gt/a-van-field/a-van-field.vue
 *
 * 功能：
 * 1. 统一包装 van-field
 * 2. 处理 required 标记
 * 3. 处理 disabled/edit 状态
 * 4. 支持 config 配置对象
 */
import { computed } from "vue";

const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  placeholder: {
    type: String,
    default: "请输入",
  },
  inputAlign: {
    type: String,
    default: "right",
  },
  edit: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

// 是否必填
const required = computed(() => {
  return (props.config.rules || []).some((rule) => rule.required);
});

// 是否禁用
const disabled = computed(() => {
  return props.config.disabled || !props.edit;
});

// 标签文本
const labelText = computed(() => {
  if (typeof props.config.label === "function") {
    return props.config.label(props.modelValue);
  }
  return props.config.label;
});

// 显示值
const showValue = computed(() => {
  return props.modelValue[props.config.key];
});

// 处理后的校验规则
const rulesConfig = computed(() => {
  return (props.config.rules || []).map((rule) => ({
    ...rule,
    name: labelText.value,
    values: props.modelValue,
  }));
});

// 单位
const unit = computed(() => {
  const { unit } = props.config;
  return typeof unit === "function" ? unit(props.modelValue) : unit;
});

// 输入处理
const handleInput = (val) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [props.config.key]: val,
  });
};

// 变化处理
const handleChange = (e) => {
  if (typeof props.config.change === "function") {
    props.config.change(e.target ? e.target.value : e, props.modelValue);
  }
  emit("change", e);
};
</script>
