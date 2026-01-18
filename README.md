# 表格表单引擎 - Vue 3 + Vite 版本

> 这是基于原 Vue 2 项目转换的 Vue 3 + Vite + Vant 4 版本，保持了与原项目一致的设计理念和 API。

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 📁 项目结构

```
form-table-engine-vue3/
├── index.html              # 主页面
├── package.json            # 项目配置
├── vite.config.js          # Vite 配置
├── README.md               # 说明文档
└── src/
    ├── main.js             # 应用入口
    ├── App.vue             # 根组件
    ├── components/
    │   ├── index.js        # 组件导出
    │   ├── AVanTable.vue   # 表格组件
    │   ├── AVanField.vue   # 字段组件
    │   ├── GForms.vue      # 表单组件
    │   └── FormTable.vue   # 表格表单组件
    └── utils/
        ├── directive.js    # 自定义指令
        └── useFormCommon.js # 公共逻辑 Composable
```

## 🔄 Vue 2 → Vue 3 转换对照

| 原项目文件 (Vue 2) | 新项目文件 (Vue 3)             | 主要变化                        |
| ------------------ | ------------------------------ | ------------------------------- |
| `directive.js`     | `src/utils/directive.js`       | 改用 Vue 3 指令 API             |
| `comm.js` (mixin)  | `src/utils/useFormCommon.js`   | 改用 Composition API Composable |
| `a-van-table.js`   | `src/components/AVanTable.vue` | SFC + `<script setup>`          |
| `a-van-field.js`   | `src/components/AVanField.vue` | SFC + `<script setup>`          |
| `forms.js`         | `src/components/GForms.vue`    | SFC + `<script setup>`          |
| `form-table.js`    | `src/components/FormTable.vue` | SFC + `<script setup>`          |
| `app.js`           | `src/App.vue`                  | SFC + `<script setup>`          |

## 🎯 核心功能

### 1️⃣ 配置驱动 (config)

```js
const config = [
  {
    key: "fieldName", // 字段名
    label: "字段标签", // 显示名称
    is: "van-field-picker", // 渲染组件
    columns: [], // 下拉选项
    rules: [], // 校验规则
    hide: (form) => false, // 动态隐藏
    change: (val, form) => {}, // 值变化回调
    setKey: "key1|key2", // 自动回填
  },
];
```

### 2️⃣ 动态隐藏 (hide)

```js
{
  key: 'creditLimit',
  hide(form) {
    return form.customerType !== 'dealer'  // 非经销商时隐藏
  }
}
```

### 3️⃣ 动态必填 (rules.required)

```js
{
  rules: [
    {
      required: function (value, { values }) {
        return values.customerType === "dealer"; // 经销商必填
      },
      message: "必填",
    },
  ];
}
```

### 4️⃣ 字段联动 (change)

```js
{
  key: 'quantity',
  change(val, form) {
    // 数量变化时自动计算金额
    form.amount = form.unitPrice * val
  }
}
```

### 5️⃣ 自动回填 (setKey)

```js
{
  key: 'productId',
  is: 'van-field-picker',
  columns: [
    { text: '产品A', value: 'P001', price: 100 }
  ],
  // 选择后自动回填: productName=text, unitPrice=price
  setKey: 'productName|text, unitPrice|price'
}
```

### 6️⃣ 自动合计 (totalKey)

```js
const tableConfig = {
  totalKey: 'totalAmount|amount',  // 将 amount 字段合计到 totalAmount
  columns: [...]
}
```

## 📦 技术栈

- **Vue 3** - Composition API + `<script setup>`
- **Vite 5** - 极速开发体验
- **Vant 4** - 移动端 UI 组件库
- **ES Modules** - 原生模块化

## 🆚 与 Vue 2 版本的主要差异

| 特性     | Vue 2 版本        | Vue 3 版本                         |
| -------- | ----------------- | ---------------------------------- |
| 响应式   | `Vue.set()`       | 直接赋值 (Proxy)                   |
| 组件定义 | Options API       | Composition API                    |
| 复用逻辑 | Mixin             | Composable                         |
| v-model  | `value` + `input` | `modelValue` + `update:modelValue` |
| 全局方法 | `Vue.prototype`   | `app.config.globalProperties`      |
| 指令 API | `bind`, `update`  | `mounted`, `updated`               |

## 🔧 使用组件

```vue
<script setup>
import { ref } from 'vue'
import { GForms, FormTable } from './components'

const formData = ref({})
const config = [...]
</script>

<template>
  <GForms v-model="formData" :config="config" />
</template>
```

## 📝 License

MIT
