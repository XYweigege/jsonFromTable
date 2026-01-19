# ✨ 用 JSON 驱动表单与表格：入门实战（基于 Vue3 项目）

> 一篇通俗易懂、带 emoji 的入门教程，参考本仓库实现（位于 `src/components`）。

作者注：本文示例基于项目中的 `GForms`、`AVanTable`、`FormTable` 组件，示例代码已放在 `src/examples/ExampleUsage.vue`，你可以直接运行查看效果。

---

## 为什么用 JSON 驱动？ 🧠

- 可配置化：表单结构、校验、下拉选项通过 JSON 描述，减少重复代码。
- 动态能力强：支持字段隐藏、动态校验、联动回调、异步选项等。
- 便于低代码：把配置存表即可动态渲染表单。

## 目录

1. 快速示例（先看效果）🎯
2. JSON 配置字段说明与示例 📦
3. 字段联动与 `setKey` 自动回填 🔁
4. 表格内嵌表单（FormTable）📝
5. 关键代码摘录（来自项目）🔍
6. 进阶建议 🌱

---

## 1. 快速示例（先看效果）👀

示例组件：`src/examples/ExampleUsage.vue`，展示了 `GForms`、`AVanTable`、`FormTable` 三者的联用。

主要思路：
- `GForms` 使用 `v-model="formData"` 和 `:config="formConfig"`。
- `AVanTable` 使用 `v-model="rows"` 和 `:headers="tableHeaders"`。
- `FormTable` 使用 `v-model="items"` 和 `:config="formTableConfig"`。

要在本地运行示例：

```bash
npm install
npm run dev
```

如果你想把示例挂载到主页面，可在 `src/App.vue` 中引入 `src/examples/ExampleUsage.vue` 并渲染。

---

## 2. JSON 配置字段说明与示例 📦

表单字段（`config`）常用属性：

- `key`：字段名（必需）
- `label`：标签文本（或函数，支持动态）
- `type`：输入类型（`text`, `number`, ...）
- `is`：特殊渲染类型，例如 `van-field-picker`
- `columns`：当 `is` 为 picker 时的选项数组或函数
- `valueKey` / `textKey`：picker 中值与文本字段名
- `setKey`：picker 选中对象回填到父数据的路径
- `rules`：校验规则数组（支持函数形式）
- `change`：字段联动回调（函数或函数数组）
- `hide`：动态隐藏（布尔或函数）

示例配置：

```js
const formConfig = [
  {
    key: 'goodsId',
    label: '商品',
    is: 'van-field-picker',
    columns: [{ text: '苹果', value: 1 }, { text: '香蕉', value: 2 }],
    valueKey: 'value',
    textKey: 'text',
    setKey: 'goodsName',
  },
  { key: 'price', label: '单价', type: 'number', unit: '元' },
]
```

表格头（`headers`）示例：

```js
const tableHeaders = [
  { type: 'index', label: '序号' },
  { key: 'name', title: '名称' },
  { key: 'price', title: '价格', unit: '元' },
  { slot: 'operating', label: '操作' },
]
```

---

## 3. 字段联动与 `setKey` 自动回填 🔁

常见场景：选择商品时自动回填商品名称、条码、单位等。

做法：在 picker 字段配置中设置 `setKey`，组件在 picker 确认时会把选中对象写回到目标字段路径，并触发 `setdata` 事件。

示例：

```js
{
  key: 'goodsId',
  label: '商品',
  is: 'van-field-picker',
  columns: [{ text: '苹果', value: 1, code: 'A001' }],
  setKey: 'goodsName', // 会把选中项的字段回填到 model
}
```

组件中处理回填的核心逻辑（摘录）：

```js
if (item.setKey) {
  vSetData(item.setKey, newValue, selected);
}
emit('update:modelValue', newValue);
emit('setdata', selected);
```

`vSetData` 是一个工具函数，用于把选中对象写到目标路径（支持点路径），例如 `goods.detail.name`。

---

## 4. 表格内嵌表单（FormTable）📝

`FormTable` 是一个「表格 + 弹窗编辑」组件，支持：

- 添加、编辑、删除行
- 配置驱动的字段（同 GForms 规则）
- 自动合计（`totalKey`）并通过 `inputs` 事件输出

示例配置：

```js
const formTableConfig = {
  columns: [
    { key: 'code', label: '编码', rules: [{ required: true, message: '必填' }] },
    { key: 'qty', label: '数量', type: 'number' },
    { key: 'price', label: '单价', type: 'number' },
  ],
  showBottomSum: true,
  totalKey: 'total|price',
}
```

`FormTable` 会在 `modelValue` 变化时计算 `totalKey` 指定的合计，并通过 `inputs` 事件把合计结果传回父组件。

---

## 5. 关键代码摘录（来自项目）🔍

以下代码均来源于 `src/components`，我在此做简化展示并添加注释，方便理解实现要点。

- 处理配置的 `computedConfig`（动态 hide、label、rules、change 支持数组）：

```js
const computedConfig = computed(() => {
  return (tempConfig.value || [])
    .map((item) => {
      const processed = { ...item };

      if (typeof processed.hide === 'function') {
        processed.c_hide = processed.hide(props.modelValue, processed);
      } else {
        processed.c_hide = processed.hide;
      }

      if (typeof processed.label === 'function') {
        processed.label = processed.label(props.modelValue, processed);
      }

      if (Array.isArray(processed.change)) {
        const fns = [...processed.change];
        processed.change = function (...args) {
          fns.forEach((fn) => fn.apply(this, args));
        };
      }

      processed.rules = (processed.rules || []).map((rule) => {
        const newRule = { ...rule };
        if (typeof newRule.required === 'function') {
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

      if (!props.edit) processed.placeholder = '-';

      return processed;
    })
    .filter((item) => !item.c_hide);
});
```

- `AVanTable` 合计逻辑（自动计算数值列 total）：

```js
const headersList = computed(() => {
  return props.headers
    .filter((col) => !col.table_hide)
    .map((col) => {
      const newCol = { ...col };
      if (col.key && !col.type) {
        newCol.total = 0;
        props.modelValue.forEach((row) => {
          newCol.total = Math.round((newCol.total + (parseFloat(row[col.key]) || 0)) * 100) / 100;
        });
      }
      return newCol;
    });
});
```

---

## 6. 进阶建议 🌱

- 可视化配置编辑器：把 `config` 存到后端，做一个可视化编辑器，生成 JSON。📊
- 支持权限/可见性控制：在字段配置中加入角色或可见条件。🔐
- 扩展自定义组件：支持 `is: 'custom'` 并通过映射注入第三方控件。🔌
- 单元测试：为配置处理、picker 回填写测试用例。🧪

---

如果你希望，我可以：

- 把这篇文章添加到仓库（已创建：`docs/JSON_FORM_BLOG.md`），或
- 自动把示例组件挂载到 `App.vue` 并启动 dev 服务器帮你截图，或
- 把文章转换为带元数据的 Markdown（例如适配掘金的 front-matter）。

你想接着做哪一项？😉
