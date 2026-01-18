<template>
  <div style="padding: 16px">
    <h2>组件入门示例</h2>

    <section style="margin-bottom: 24px">
      <h3>GForms 单行表单</h3>
      <GForms v-model="formData" :config="formConfig" @setdata="onSetData" />
      <pre style="background: #f7f7f7; padding: 8px">{{ formData }}</pre>
    </section>

    <section style="margin-bottom: 24px">
      <h3>AVanTable 简单表格</h3>
      <AVanTable v-model="rows" :headers="tableHeaders" :show-bottom-sum="true">
        <template #operating="{ value: row, index }">
          <button @click="removeRow(index)">删除</button>
        </template>
      </AVanTable>
      <pre style="background: #f7f7f7; padding: 8px">{{ rows }}</pre>
    </section>

    <section>
      <h3>FormTable 表格内嵌表单（增删改）</h3>
      <FormTable v-model="items" :config="formTableConfig" @inputs="onInputs" />
      <pre style="background: #f7f7f7; padding: 8px">{{ items }}</pre>
    </section>
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
