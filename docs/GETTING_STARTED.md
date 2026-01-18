# 入门示例 — 表格与表单组件使用指南

本文档展示如何在项目中使用表格组件和表单组件（`AVanTable`, `GForms`, `FormTable`, `AVanField`），包括如何传值、监听事件与自定义插槽。

**快速说明**

- **组件位置**: 组件在 `src/components` 目录下。
- **常用模式**: 使用 `v-model` 双向绑定数据；通过 `config` / `headers` 数组传入字段定义；使用插槽自定义单元格和操作列。

**AVanTable（表格）**

- **Props**:
  - `modelValue` (Array): 表格数据，通常用 `v-model` 绑定。
  - `headers` (Array): 表头配置数组，每项为对象，常用字段：`key`、`label`/`title`、`type`（例如 `index`）、`slot`（插槽名）、`width`、`unit`、`table_hide` 等。
  - `showBottomSum` (Boolean): 是否显示合计行（组件会自动计算标记为数值列的合计）。
- **插槽**:
  - 自定义列通过在 `headers` 中指定 `slot` 字段，然后在组件使用处提供对应插槽：

```vue
<AVanTable v-model="rows" :headers="headers">
  <template #operating="{ value: row, index }">
    <button @click="edit(index)">编辑</button>
  </template>
</AVanTable>
```

**GForms（单行/对象表单）**

- **Props**:
  - `modelValue` (Object): 表单对象，通常用 `v-model`。
  - `config` (Array): 字段配置数组；每个字段可包含：`key`, `label`, `type`, `placeholder`, `rules`, `unit`, `is`（自定义组件类型）, `columns`（picker 数据）, `valueKey`, `textKey`, `setKey`（回填路径）, `change`（字段联动回调）, `hide` 等。
- **事件**:
  - 组件通过 `v-model` 更新父级数据（`update:modelValue`）。
  - `setdata`：当选择器返回完整对象并触发 `setKey` 回填时，会触发 `setdata`，携带选中对象。

使用示例：

```vue
<GForms v-model="formData" :config="formConfig" />

// formConfig 示例项 { key: 'goodsId', label: '商品', is: 'van-field-picker',
columns: [{ text: '苹果', value: 1 }, { text: '香蕉', value: 2 }], valueKey:
'value', textKey: 'text', setKey: 'goodsName', }
```

**FormTable（表格内嵌表单 - 增删改）**

- **Props**:
  - `modelValue` (Array): 明细数组，使用 `v-model` 双向绑定。
  - `config` (Object / Array): 配置字段（同 GForms 字段项），另外支持 `totalKey` 配置来计算合计并通过 `inputs` 事件输出合计结果。
- **事件**:
  - `update:modelValue`：数据变更时触发（v-model）
  - `inputs`：输出合计或派生结果（例如 `totalKey` 指定的字段）
  - `open`：弹窗打开时触发

示例用法见仓库中的示例组件：

- 示例文档: [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)
- 示例组件: [src/examples/ExampleUsage.vue](src/examples/ExampleUsage.vue)

下面是一个完整示例组件（也在仓库中），展示如何在页面同时使用 `GForms`、`AVanTable` 与 `FormTable`：

```vue
<template>
  <div>
    <h3>单行表单示例</h3>
    <GForms v-model="formData" :config="formConfig" @setdata="onSetData" />

    <h3>简单表格示例</h3>
    <AVanTable v-model="rows" :headers="tableHeaders" :show-bottom-sum="true">
      <template #operating="{ value: row, index }">
        <button @click="removeRow(index)">删除</button>
      </template>
    </AVanTable>

    <h3>表格内嵌表单示例（FormTable）</h3>
    <FormTable v-model="items" :config="formTableConfig" @inputs="onInputs" />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import GForms from "../components/GForms.vue";
import AVanTable from "../components/AVanTable.vue";
import FormTable from "../components/FormTable.vue";

const formData = ref({ goodsId: null, goodsName: "", price: 0 });

const formConfig = [
  {
    key: "goodsId",
    label: "商品",
    is: "van-field-picker",
    columns: [
      { text: "苹果", value: 1 },
      { text: "香蕉", value: 2 },
    ],
    valueKey: "value",
    textKey: "text",
    setKey: "goodsName",
  },
  { key: "price", label: "单价", type: "number", unit: "元" },
];

const rows = ref([
  { name: "苹果", price: 3 },
  { name: "香蕉", price: 2 },
]);

const tableHeaders = computed(() => [
  { type: "index", label: "序号" },
  { key: "name", title: "名称" },
  { key: "price", title: "价格", unit: "元" },
  { slot: "operating", label: "操作" },
]);

const items = ref([{ code: "A001", qty: 2, price: 10 }]);

const formTableConfig = {
  columns: [
    {
      key: "code",
      label: "编码",
      rules: [{ required: true, message: "必填" }],
    },
    { key: "qty", label: "数量", type: "number" },
    { key: "price", label: "单价", type: "number" },
  ],
  showBottomSum: true,
  totalKey: "total|price",
};

const removeRow = (index) => {
  rows.value.splice(index, 1);
};

const onSetData = (selected) => {
  console.log("setdata", selected);
};

const onInputs = (totals) => {
  console.log("inputs totals", totals);
};
</script>
```

更多高级用法（字段联动、异步 columns、动态隐藏、setKey 回填等）见组件源码与注释：

- 组件文件: [src/components/AVanTable.vue](../src/components/AVanTable.vue)
- 组件文件: [src/components/GForms.vue](../src/components/GForms.vue)
- 组件文件: [src/components/FormTable.vue](../src/components/FormTable.vue)

如果需要，我可以把上面的示例注册到路由或在 `App.vue` 中直接挂载并演示运行步骤。
