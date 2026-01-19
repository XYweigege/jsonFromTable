<template>
  <div class="demo-container">
    <h1 class="demo-title">表格表单引擎 Vue3 版</h1>

    <!-- 基础表单 -->
    <div class="demo-section">
      <div class="section-title">📋 基础表单 (g-forms)</div>
      <GForms v-model="basicForm" :config="basicFormConfig" :edit="true" />
    </div>

    <!-- 表格表单 -->
    <div class="demo-section">
      <div class="section-title">📊 产品明细 (form-table)</div>
      <FormTable
        v-model="productList"
        :config="tableConfig"
        :values="formData"
        :all-edit="true"
        label="产品明细"
        :rules="[{ required: true, message: '请至少添加一条产品' }]"
        @inputs="handleInputs"
      />

      <!-- 合计展示 -->
      <div v-if="productList.length" class="total-row">
        <span>合计金额：</span>
        <span class="amount">¥{{ formData.totalAmount }}</span>
      </div>
    </div>

    <!-- 提交按钮 -->
    <div style="padding: 16px">
      <van-button type="primary" block round @click="handleSubmit">
        提交
      </van-button>
    </div>

    <!-- 调试区域 -->
    <div class="demo-section">
      <div class="section-title">🔧 调试信息</div>
      <div style="padding: 12px; font-size: 12px">
        <p><strong>基础表单数据：</strong></p>
        <pre>{{ JSON.stringify(basicForm, null, 2) }}</pre>
        <p><strong>产品列表：</strong></p>
        <pre>{{ JSON.stringify(productList, null, 2) }}</pre>
        <p><strong>合计：</strong>{{ formData.totalAmount }}</p>
      </div>
    </div>

    <ExampleUsage />
  </div>
</template>

<script setup>
/**
 * 主应用入口 - Vue 3 版本
 * 演示表格表单引擎的使用
 */
import { ref, reactive } from "vue";
import { showToast, showDialog } from "vant";
import { GForms, FormTable } from "./components";
import ExampleUsage from "./examples/ExampleUsage.vue";
// ========== forms 组件配置 ==========
const basicFormConfig = [
  {
    key: "customerName",
    label: "客户名称",
    is: "van-field",
    placeholder: "请输入客户名称",
    rules: [{ required: true, message: "必填" }],
  },
  {
    key: "customerType",
    label: "客户类型",
    is: "van-field-picker",
    columns: [
      { text: "经销商", value: "dealer" },
      { text: "终端门店", value: "store" },
      { text: "消费者", value: "consumer" },
    ],
    rules: [{ required: true, message: "必填" }],
    // 字段联动：客户类型变化时更新信用额度
    change(val, form) {
      console.log("客户类型变化:", val);
      if (val === "dealer") {
        form.creditLimit = "50000";
      } else {
        form.creditLimit = "";
      }
    },
  },
  {
    key: "creditLimit",
    label: "信用额度",
    is: "van-field",
    type: "number",
    unit: "元",
    // 动态隐藏：只有经销商才显示
    hide(form) {
      return form.customerType !== "dealer";
    },
    // 动态必填
    rules: [
      {
        required: function (value, { values }) {
          return values.customerType === "dealer";
        },
        message: "经销商必须填写信用额度",
      },
    ],
  },
  {
    key: "remark",
    label: "备注",
    is: "van-field",
    placeholder: "选填",
  },
];

// forms 表单数据
const basicForm = ref({
  customerName: "",
  customerType: "",
  creditLimit: "",
  remark: "",
});

// ========== form-table 组件配置 ==========
const tableConfig = reactive({
  // 合计配置：将 amount 字段合计到 formData.totalAmount
  totalKey: "totalAmount|amount",
  // 防重字段
  only: "productId",
  // 显示底部合计行
  showBottomSum: true,
  // 列配置
  columns: [
    {
      key: "productId",
      label: "产品",
      is: "van-field-picker",
      columns: [
        { text: "产品A", value: "P001", price: 688 },
        { text: "产品B", value: "P002", price: 1288 },
        { text: "产品C", value: "P003", price: 2888 },
      ],
      // setKey：选择后自动回填 productName 和 unitPrice
      setKey: "productName|text, unitPrice|price",
      rules: [{ required: true, message: "必填" }],
    },
    {
      key: "productName",
      label: "产品名称",
      is: "van-field",
      disabled: true,
      table_hide: true, // 表格中隐藏此列
    },
    {
      key: "quantity",
      label: "数量",
      is: "van-field",
      type: "number",
      unit: "瓶",
      rules: [{ required: true, message: "必填" }],
      // 数量变化时自动计算金额
      change(val, form) {
        const price = parseFloat(form.unitPrice) || 0;
        const qty = parseFloat(val) || 0;
        form.amount = Math.round(price * qty * 100) / 100;
      },
    },
    {
      key: "unitPrice",
      label: "单价",
      is: "van-field",
      type: "number",
      disabled: true,
      unit: "元",
    },
    {
      key: "amount",
      label: "金额",
      is: "van-field",
      type: "number",
      disabled: true,
      unit: "元",
    },
  ],
});

// 表格数据
const productList = ref([]);

// 外层表单数据（用于接收合计值）
const formData = reactive({
  totalAmount: 0,
});

/**
 * 处理 form-table 的 inputs 事件
 * 接收合计值更新
 */
const handleInputs = (data) => {
  Object.keys(data).forEach((key) => {
    formData[key] = data[key];
  });
};

/**
 * 提交数据
 */
const handleSubmit = () => {
  // 校验表单
  if (!basicForm.value.customerName) {
    showToast("请填写客户名称");
    return;
  }
  if (!basicForm.value.customerType) {
    showToast("请选择客户类型");
    return;
  }
  if (
    basicForm.value.customerType === "dealer" &&
    !basicForm.value.creditLimit
  ) {
    showToast("经销商必须填写信用额度");
    return;
  }

  // 校验表格
  if (productList.value.length === 0) {
    showToast("请至少添加一条产品明细");
    return;
  }

  // 组装提交数据
  const submitData = {
    ...basicForm.value,
    productList: productList.value,
    totalAmount: formData.totalAmount,
  };

  console.log("提交数据:", submitData);
  showDialog({
    title: "提交成功",
    message: `客户：${submitData.customerName}\n产品数：${submitData.productList.length}条\n总金额：¥${submitData.totalAmount}`,
  });
};
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #f5f5f5;
  padding: 12px;
}

.demo-container {
  max-width: 500px;
  margin: 0 auto;
}

.demo-title {
  text-align: center;
  padding: 16px;
  color: #323233;
  font-size: 18px;
}

.demo-section {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
}

.section-title {
  padding: 12px 16px;
  background: #f7f8fa;
  font-weight: bold;
  color: #323233;
  border-bottom: 1px solid #ebedf0;
  font-size: 14px;
}

.total-row {
  padding: 12px 16px;
  background: #fffbe8;
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #ebedf0;
  font-size: 14px;
}

.total-row .amount {
  color: #ee0a24;
  font-weight: bold;
}

pre {
  white-space: pre-wrap;
  word-break: break-all;
  background: #f7f8fa;
  padding: 8px;
  border-radius: 4px;
  margin: 8px 0;
}
</style>
