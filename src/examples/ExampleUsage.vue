<template>
  <div style="padding: 16px">
    <h2>组件入门示例</h2>

    <section style="margin-bottom: 24px">
      <h3>GForms 单行表单</h3>
      <GForms v-model="formData" :config="formConfig" @setdata="onSetData" />
      <pre style="background: #f7f7f7; padding: 8px">{{ formData }}</pre>
    </section>

    <section style="margin-bottom: 24px">
      <h3>复杂场景 1：差旅报销（联动/异步选项/动态必填）</h3>
      <GForms v-model="travelForm" :config="travelConfig" />
      <pre style="background: #f7f7f7; padding: 8px">{{ travelForm }}</pre>
    </section>

    <section style="margin-bottom: 24px">
      <h3>复杂场景 2：采购申请（自动计算/条件必填/动态隐藏）</h3>
      <GForms v-model="purchaseForm" :config="purchaseConfig" />
      <pre style="background: #f7f7f7; padding: 8px">{{ purchaseForm }}</pre>
    </section>

    <section style="margin-bottom: 24px">
      <h3>复杂场景 3：保险投保（多级联动/人群分层）</h3>
      <GForms v-model="insuranceForm" :config="insuranceConfig" />
      <pre style="background: #f7f7f7; padding: 8px">{{ insuranceForm }}</pre>
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

const travelForm = ref({
  tripType: "domestic",
  transport: "train",
  ticketNo: "",
  city: "",
  overnight: "no",
  hotelFee: 0,
  currency: "CNY",
  amount: 0,
});

const travelConfig = [
  {
    key: "tripType",
    label: "差旅类型",
    is: "van-field-picker",
    columns: [
      { text: "国内", value: "domestic" },
      { text: "国际", value: "international" },
    ],
  },
  {
    key: "transport",
    label: "交通方式",
    is: "van-field-picker",
    columns: [
      { text: "火车", value: "train" },
      { text: "飞机", value: "flight" },
      { text: "自驾", value: "car" },
    ],
  },
  {
    key: "ticketNo",
    label: (values) => (values.transport === "flight" ? "航班号" : "车次号"),
    placeholder: "请输入编号",
    hide: (values) => values.transport === "car",
    rules: [
      {
        required: (val, ctx) => ctx.values.transport !== "car",
        message: "请填写编号",
      },
    ],
  },
  {
    key: "city",
    label: "出差城市",
    is: "van-field-picker",
    placeholder: "请选择城市",
    columns: (values) =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve(
            values.tripType === "international"
              ? [
                  { text: "新加坡", value: "SG" },
                  { text: "东京", value: "JP" },
                ]
              : [
                  { text: "上海", value: "SH" },
                  { text: "深圳", value: "SZ" },
                ],
          );
        }, 300);
      }),
  },
  {
    key: "overnight",
    label: "是否过夜",
    is: "van-field-picker",
    columns: [
      { text: "否", value: "no" },
      { text: "是", value: "yes" },
    ],
  },
  {
    key: "hotelFee",
    label: "酒店费用",
    type: "number",
    unit: (values) => (values.currency === "USD" ? "美元" : "元"),
    hide: (values) => values.overnight !== "yes",
    rules: [
      {
        required: (val, ctx) => ctx.values.overnight === "yes",
        message: "请填写酒店费用",
      },
    ],
  },
  {
    key: "currency",
    label: "币种",
    is: "van-field-picker",
    columns: [
      { text: "人民币", value: "CNY" },
      { text: "美元", value: "USD" },
    ],
  },
  {
    key: "amount",
    label: "报销金额",
    type: "number",
    unit: (values) => (values.currency === "USD" ? "美元" : "元"),
    rules: [{ required: true, message: "请填写金额" }],
  },
];

const purchaseForm = ref({
  vendorId: null,
  vendorName: "",
  vendorCode: "",
  itemName: "",
  qty: 1,
  price: 0,
  total: 0,
  urgent: "no",
  urgentReason: "",
  budget: 0,
  approveLevel: "",
});

const purchaseConfig = [
  {
    key: "vendorId",
    label: "供应商",
    is: "van-field-picker",
    columns: [
      { text: "绿叶科技", value: 1, name: "绿叶科技", code: "V-001" },
      { text: "星辰设备", value: 2, name: "星辰设备", code: "V-002" },
    ],
    setKey: "vendorName|name,vendorCode|code",
  },
  { key: "vendorCode", label: "供应商编码", readonly: true },
  {
    key: "itemName",
    label: "采购物品",
    rules: [{ required: true, message: "必填" }],
  },
  {
    key: "qty",
    label: "数量",
    type: "number",
    allInput: (formData) => {
      formData.total = Number(formData.qty || 0) * Number(formData.price || 0);
    },
  },
  {
    key: "price",
    label: "单价",
    type: "number",
    unit: "元",
    allInput: (formData) => {
      formData.total = Number(formData.qty || 0) * Number(formData.price || 0);
    },
  },
  {
    key: "total",
    label: "金额合计",
    type: "number",
    readonly: true,
    unit: "元",
  },
  {
    key: "urgent",
    label: "是否紧急",
    is: "van-field-picker",
    columns: [
      { text: "否", value: "no" },
      { text: "是", value: "yes" },
    ],
  },
  {
    key: "urgentReason",
    label: "紧急原因",
    hide: (values) => values.urgent !== "yes",
    rules: [
      {
        required: (val, ctx) => ctx.values.urgent === "yes",
        message: "请填写紧急原因",
      },
    ],
  },
  { key: "budget", label: "预算金额", type: "number", unit: "元" },
  {
    key: "approveLevel",
    label: "审批级别",
    is: "van-field-picker",
    columns: [
      { text: "经理", value: "manager" },
      { text: "总监", value: "director" },
      { text: "副总", value: "vp" },
    ],
    rules: [
      {
        required: (val, ctx) => Number(ctx.values.budget || 0) >= 10000,
        message: "预算较高，请选择审批级别",
      },
    ],
  },
];

const insuranceForm = ref({
  plan: "basic",
  age: 28,
  hasBeneficiary: "no",
  beneficiaryName: "",
  beneficiaryRelation: "",
  guardianName: "",
  coverage: 50,
});

const insuranceConfig = [
  {
    key: "plan",
    label: "保障计划",
    is: "van-field-picker",
    columns: [
      { text: "基础版", value: "basic" },
      { text: "尊享版", value: "pro" },
    ],
  },
  { key: "age", label: "投保人年龄", type: "number" },
  {
    key: "coverage",
    label: (values) =>
      values.plan === "pro" ? "保额（尊享）" : "保额（基础）",
    type: "number",
    unit: "万元",
    rules: [{ required: true, message: "请填写保额" }],
  },
  {
    key: "hasBeneficiary",
    label: "是否指定受益人",
    is: "van-field-picker",
    columns: [
      { text: "否", value: "no" },
      { text: "是", value: "yes" },
    ],
  },
  {
    key: "beneficiaryName",
    label: "受益人姓名",
    hide: (values) => values.hasBeneficiary !== "yes",
    rules: [
      {
        required: (val, ctx) => ctx.values.hasBeneficiary === "yes",
        message: "请填写受益人姓名",
      },
    ],
  },
  {
    key: "beneficiaryRelation",
    label: "受益人与被保人关系",
    hide: (values) => values.hasBeneficiary !== "yes",
    rules: [
      {
        required: (val, ctx) => ctx.values.hasBeneficiary === "yes",
        message: "请填写关系",
      },
    ],
  },
  {
    key: "guardianName",
    label: "监护人姓名",
    hide: (values) => Number(values.age || 0) >= 18,
    rules: [
      {
        required: (val, ctx) => Number(ctx.values.age || 0) < 18,
        message: "未成年人需填写监护人",
      },
    ],
  },
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
