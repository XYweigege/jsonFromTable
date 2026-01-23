# 用配置驱动的“高级表单”：从 0 到可复用（基于 Vue3 + Vant 的 GForms）

> 目标：用一套 JSON 配置，做出“能隐藏、能联动、能动态必填、能异步加载选项、还能自动回填”的高级表单。
>
> 本文代码参考本项目的 `GForms.vue`、`useFormCommon.js`、`directive.js`（`vSetData`），示例配置来自 `src/examples/ExampleUsage.vue`。

---

## 1. 为什么要做“高级表单”？

业务表单常见痛点：

- 字段太多：手写模板维护成本高、改一处容易漏。
- 规则是动态的：某些字段“条件必填 / 条件隐藏 / 标签随状态变化”。
- 选项是动态的：下拉列表要根据前置条件异步加载。
- 字段之间有联动：改一个字段，需要清空/回填/计算其它字段。

如果每个表单都用模板堆 `v-if + watch + computed`，会越来越难维护。

**配置驱动（JSON Form）**的思路是：

- 把“字段长什么样、怎么校验、怎么联动、怎么取选项”全部收敛到一份配置里。
- 渲染层（组件）只负责“按配置渲染 + 触发回调 + 维护通用能力”。

这样你就能在多个业务表单中复用同一套渲染引擎（也更接近低代码）。

---

## 2. GForms 的核心 API：一个 v-model + 一份 config

在本项目里，使用方式非常简单：

```vue
<GForms v-model="formData" :config="formConfig" @setdata="onSetData" />
```

- `v-model`：整份表单数据对象（一个对象装所有字段值）。
- `config`：字段描述数组，每一项描述一个字段。
- `@setdata`：选择器确认时把“选中对象”抛给外部（同时内部支持自动回填）。

这种 API 的好处是：表单数据结构统一、字段可随配置增删、外部不需要关心每个字段的 v-model。

---

## 3. 配置能描述什么？（高级能力清单）

一条字段配置在本项目里常见的属性包括：

- `key`：字段名（写入 `modelValue[key]`）
- `label`：标签（支持函数，动态 label）
- `type`：输入类型（如 `text` / `number`）
- `placeholder`：占位
- `readonly` / `disabled`
- `unit`：右侧单位（支持函数，动态单位）
- `rules`：校验规则数组（`required` 支持函数实现“条件必填”）
- `hide`：隐藏规则（支持函数实现“条件隐藏”）
- `change`：字段联动回调（支持函数数组）
- `allInput`：全局输入时触发（用于自动计算、同步其它字段）
- `is`：渲染类型（默认输入框；本项目还支持 `van-field-picker`）
- `columns`：下拉选项（数组或函数，函数可返回 Promise 实现异步）
- `valueKey` / `textKey`：下拉选项字段映射
- `setKey`：选中后自动回填其它字段（支持映射与固定值）

接下来按能力拆解 GForms 是如何实现这些“高级效果”的。

---

## 4. 动态隐藏：把 v-if 从模板搬到配置里

在 `GForms.vue` 中，表单最终渲染用的是一个 `computedConfig`：

- 遍历 `tempConfig`
- 把 `hide`（布尔/函数）归一成 `c_hide`
- 最后 `.filter(item => !item.c_hide)`

核心逻辑（概念化简化版）：

```js
const computedConfig = computed(() => {
  return (tempConfig.value || [])
    .map((item) => {
      const processed = { ...item };
      processed.c_hide =
        typeof processed.hide === "function"
          ? processed.hide(props.modelValue, processed)
          : processed.hide;
      return processed;
    })
    .filter((item) => !item.c_hide);
});
```

你写业务配置时就可以非常自然：

```js
{
  key: 'urgentReason',
  label: '紧急原因',
  hide: (values) => values.urgent !== 'yes',
}
```

**收益**：业务侧只写规则，不再写模板分支。

---

## 5. 动态 label：一个字段多种语义

某些字段名称会随上下文变化，例如“航班号/车次号”。配置里直接把 `label` 写成函数即可：

```js
{
  key: 'ticketNo',
  label: (values) => (values.transport === 'flight' ? '航班号' : '车次号'),
}
```

GForms 在处理配置时会把函数结果计算成最终字符串。

---

## 6. 动态必填（条件校验）：rules.required 支持函数

很多表单“是否必填”不是常量，而是条件判断：

- 交通方式为“自驾”时，不需要填写编号
- 选择“过夜=是”时，酒店费用必填

项目里做法是：允许 `rules[].required` 为函数；在 `computedConfig` 中统一求值。

业务写法（示例来自 `ExampleUsage.vue`）：

```js
{
  key: 'hotelFee',
  label: '酒店费用',
  hide: (values) => values.overnight !== 'yes',
  rules: [
    {
      required: (val, ctx) => ctx.values.overnight === 'yes',
      message: '请填写酒店费用',
    },
  ],
}
```

GForms 处理规则的思路（概念化简化版）：

```js
processed.rules = (processed.rules || []).map((rule) => {
  const newRule = { ...rule };
  if (typeof newRule.required === "function") {
    newRule.required = newRule.required(props.modelValue[processed.key], {
      values: props.modelValue,
      message: newRule.message,
      name: processed.label,
    });
  }
  return { ...newRule, values: props.modelValue };
});
```

**关键点**：

- 规则里能拿到整份 `values`，条件判断就足够灵活。
- `isRequired(item)` 用来决定 UI 是否显示必填星标（依赖当前规则求值结果）。

---

## 7. 联动 change：单个函数不够，用数组组合更真实

真实业务经常“一个字段变化，需要触发多个动作”。项目里支持：

- `change` 可以是函数
- 也可以是函数数组（GForms 会合并成一个函数顺序执行）

配置写法示例：

```js
{
  key: 'qty',
  label: '数量',
  type: 'number',
  change: [
    (val, values) => { /* 清空某字段 */ },
    (val, values) => { /* 触发重新计算 */ },
  ]
}
```

执行时机：在 `handleChange` 中统一走 `useFormCommon` 的 `allChange`，它内部做了一个小延迟，确保值先完成更新。

---

## 8. 自动计算：allInput 让“派生字段”更优雅

在采购示例里，`total = qty * price` 是典型派生字段。

你可能会想到 `watch(qty, price)`，但配置驱动里更希望把逻辑和字段绑定在一起。

项目做法：每次输入变更，遍历配置项执行 `allInput(formData, item)`。

示例配置（来自 `ExampleUsage.vue`）：

```js
{
  key: 'qty',
  label: '数量',
  type: 'number',
  allInput: (formData) => {
    formData.total = Number(formData.qty || 0) * Number(formData.price || 0);
  },
},
{
  key: 'price',
  label: '单价',
  type: 'number',
  allInput: (formData) => {
    formData.total = Number(formData.qty || 0) * Number(formData.price || 0);
  },
},
{
  key: 'total',
  label: '金额合计',
  readonly: true,
}
```

这样写的好处：

- 派生逻辑与字段配置“放在一起”，阅读成本更低。
- 表单引擎统一触发，不需要每个业务页面单独 watch。

---

## 9. 异步 columns：下拉选项按需加载

很多下拉的选项来自接口：

- 依赖其它字段（比如国内/国际影响城市列表）
- 需要异步拉取

项目里的 `useFormCommon` 支持：当 `columns` 是函数时，可以返回数组或 Promise。

示例（来自 `ExampleUsage.vue`）：

```js
{
  key: 'city',
  label: '出差城市',
  is: 'van-field-picker',
  columns: (values) =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          values.tripType === 'international'
            ? [{ text: '新加坡', value: 'SG' }, { text: '东京', value: 'JP' }]
            : [{ text: '上海', value: 'SH' }, { text: '深圳', value: 'SZ' }],
        );
      }, 300);
    }),
}
```

`useFormCommon` 的处理要点：

- 深拷贝配置到 `tempConfig`
- 扫描到 `columns` 为函数时执行它
- 如果返回 Promise，就 `then` 回填到对应字段的 `columns`

这让你可以把“取数逻辑”放进配置里，表单组件层完全不用知道接口细节。

---

## 10. 选择器 + 自动回填 setKey：选中一项，填一片字段

在移动端表单里，最常见是“选某个对象（商品/供应商/机构），然后自动回填名称、编码、地址…”。

项目里 `GForms` 做了两层能力：

1) 选择器确认时，拿到 `selectedOptions[0]` 作为选中对象 `selected`
2) 如果配置了 `setKey`，就调用 `vSetData(setKey, formData, selected)` 做回填

### 10.1 setKey 的写法

项目支持两类写法（见 `src/utils/directive.js` 的解析逻辑）：

- 映射赋值：`targetKey|sourceKey`
- 固定值赋值：`key=fixedValue`

并且支持逗号分隔多个映射。

示例：选择供应商后回填名称、编码：

```js
{
  key: 'vendorId',
  label: '供应商',
  is: 'van-field-picker',
  columns: [
    { text: '绿叶科技', value: 1, name: '绿叶科技', code: 'V-001' },
  ],
  setKey: 'vendorName|name,vendorCode|code',
}
```

### 10.2 vSetData 的核心逻辑

`vSetData` 会把 `setKey` 字符串解析成映射表，然后写入目标对象：

```js
export const vSetData = (arg, value, e) => {
  // 解析 setKey: 'a|b,c=d'
  // - a|b 表示 value.a = e.b
  // - c=d 表示 value.c = 'd'
};
```

你不需要在业务里手写“选中后回填 N 个字段”的代码，配置即可完成。

---

## 11. 一个“高级表单”完整示例：采购申请

把前面的能力组合起来，就能覆盖大部分复杂表单场景：

- 供应商选择器：`setKey` 自动回填
- 金额自动计算：`allInput`
- 条件隐藏：紧急原因只在紧急时显示
- 条件必填：预算大于阈值时必选审批级别

你可以直接参考项目示例：`src/examples/ExampleUsage.vue` 里的 `purchaseConfig`。

---

## 12. 实战建议（写配置时更稳更易维护）

- 让配置“纯描述”：尽量不要在业务里直接操作 DOM 或组件实例。
- `hide/label/required` 函数保持纯函数：只依赖入参 `values`，不要产生副作用。
- `allInput` 只做同步派生：复杂计算/接口请求建议放到 `change` 或外部逻辑。
- 选择器 `columns` 异步要处理依赖：如果依赖前置字段变化，建议在 `change` 中清空旧值并触发重新加载。
- `setKey` 适合做“选中对象 => 表单字段”的映射；如果回填逻辑非常复杂，再用 `change` 扩展。

---

## 13. 结语：把“复杂”收敛到引擎，把“变化”留给配置

当你把表单能力做成引擎（GForms + useFormCommon + vSetData），业务侧就只需要维护“配置与数据”，而不是一堆模板分支与 watch。

如果你后续想继续升级这套引擎，常见方向包括：

- 支持更多 `is` 渲染类型（日期、级联、上传、地址选择等）
- 表单分组/折叠、栅格布局
- 统一的异步校验（接口校验）
- 字段级权限（可见/可编辑）

---

### 附：本文对应源码位置

- 表单渲染：`src/components/GForms.vue`
- 公共逻辑：`src/utils/useFormCommon.js`
- 自动回填：`src/utils/directive.js`（`vSetData`）
- 示例配置：`src/examples/ExampleUsage.vue`
