/**
 * 自定义指令 - Vue 3 版本
 * 对应原 guotai/src/gt/directive.js
 *
 * 核心功能：
 * 1. v-setdata - 选择后自动回填关联字段
 * 2. v-models - 类似 v-model，支持 inputs 事件批量更新
 */

/**
 * setKey 格式解析和赋值
 * @param {string} arg - setKey 配置字符串
 * @param {object} value - 目标对象
 * @param {object} e - 选中的数据对象
 */
export const vSetData = (arg, value, e) => {
  if (typeof arg !== "string" || !arg) return;

  // 解析 setKey 格式: 'targetKey1|sourceKey1, targetKey2|sourceKey2' 或 'key1=fixedValue'
  const mapping = arg
    .replace(/\s+/g, "")
    .split(",")
    .reduce((obj, item) => {
      if (item.includes("=")) {
        // 固定值赋值: key=value
        const [key, fixedValue] = item.split("=");
        obj[key] = { type: "fixed", value: fixedValue };
      } else {
        // 映射赋值: targetKey|sourceKey
        const [targetKey, sourceKey] = item.split("|");
        obj[targetKey] = { type: "map", key: sourceKey || targetKey };
      }
      return obj;
    }, {});

  // 执行赋值
  if (typeof e === "object" && e !== null) {
    Object.keys(mapping).forEach((targetKey) => {
      const config = mapping[targetKey];
      if (config.type === "fixed") {
        value[targetKey] = config.value;
      } else {
        value[targetKey] = e[config.key];
      }
    });
  }
};

/**
 * v-setdata 指令
 * 用法: v-setdata:setKeyConfig="targetObject"
 * 配合组件的 setdata 事件使用
 */
export const vSetdataDirective = {
  mounted(el, binding, vnode) {
    const component = vnode.component;
    if (component && component.emit) {
      // Vue 3 中需要通过 props 传递的 onSetdata 来监听
      const originalEmit = component.emit;
      component.emit = function (event, ...args) {
        if (event === "setdata") {
          const e = args[0];
          if (e && JSON.stringify(e) !== "{}") {
            vSetData(binding.arg, binding.value, e);
          }
        }
        return originalEmit.call(this, event, ...args);
      };
    }
  },
};

/**
 * v-models 指令
 * 用法: v-models="formObject"
 * 监听组件的 inputs 事件，批量更新表单字段
 */
export const vModelsDirective = {
  mounted(el, binding, vnode) {
    const component = vnode.component;
    if (component && component.emit) {
      const originalEmit = component.emit;
      component.emit = function (event, ...args) {
        if (event === "inputs") {
          const data = args[0] || {};
          Object.keys(data).forEach((key) => {
            binding.value[key] = data[key];
          });
        }
        return originalEmit.call(this, event, ...args);
      };
    }
  },
};

/**
 * 注册所有指令
 */
export const registerDirectives = (app) => {
  app.directive("setdata", vSetdataDirective);
  app.directive("models", vModelsDirective);
};

export default {
  install(app) {
    registerDirectives(app);
    // 全局方法
    app.config.globalProperties.$vSetData = vSetData;
  },
};
