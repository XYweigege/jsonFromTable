/**
 * 公共逻辑 - Vue 3 Composable 版本
 * 对应原 guotai/src/gt/form/comm.js
 *
 * 功能：
 * 1. 配置监听和异步处理
 * 2. setKey 恢复处理
 * 3. 异步列加载
 */

import { ref, watch, computed, onMounted } from "vue";
import { vSetData } from "./directive";

/**
 * 表单公共逻辑 Composable
 * @param {Ref} config - 配置引用
 * @param {Ref} value - 表单值引用
 */
export function useFormCommon(config, value) {
  const tempConfig = ref([]);

  /**
   * setKey 恢复处理
   * 当数据已有值时，根据 columns 恢复关联字段
   */
  const setKey = () => {
    const configs = tempConfig.value || [];
    configs.forEach((item) => {
      if (Array.isArray(item.columns) && item.setKey) {
        const currentValue = value.value[item.key];
        // 在 columns 中查找匹配项
        const matched = item.columns.find((col) => {
          const valueKey = item.valueKey || "value";
          return col[valueKey] === currentValue;
        });
        // 恢复关联字段
        if (matched) {
          vSetData(item.setKey, value.value, matched);
        }
      }
    });
  };

  /**
   * 异步函数处理
   * 当 columns 为函数时，调用并等待结果
   */
  const asyncFun = () => {
    let configArray = [];

    // 兼容数组和对象格式
    const configVal = config.value;
    if (Array.isArray(configVal)) {
      configArray = [...configVal];
    } else if (configVal && typeof configVal === "object") {
      configArray = [...(configVal.columns || [])];
    }

    // 深拷贝配置
    tempConfig.value = configArray.map((item) => ({ ...item }));

    // 处理异步列
    tempConfig.value.forEach((item, index) => {
      if (typeof item.columns === "function") {
        const result = item.columns(value.value, item);

        // 判断是否为 Promise
        if (result && typeof result.then === "function") {
          result
            .then((res) => {
              tempConfig.value[index].columns = res;
            })
            .catch((err) => {
              console.error(`加载 ${item.key} 列数据失败:`, err);
              tempConfig.value[index].columns = [];
            });
        } else if (Array.isArray(result)) {
          tempConfig.value[index].columns = result;
        }

        // 先设为空数组，等异步结果
        item.columns = [];
      }
    });
  };

  /**
   * 公共变化处理
   * 触发 change 回调
   */
  const allChange = (e, fun, item, formData) => {
    if (typeof fun === "function") {
      // 延迟执行，确保值已更新
      setTimeout(() => {
        fun(e, formData || value.value, item);
      }, 10);
    }
  };

  /**
   * 全局输入处理
   * 遍历配置执行 allInput 回调
   */
  const itemInput = (formData) => {
    const configs = tempConfig.value || [];
    configs.forEach((item) => {
      if (typeof item.allInput === "function") {
        item.allInput(formData, item);
      }
    });
    return formData;
  };

  // 监听 config 变化
  watch(
    () => config.value,
    () => {
      asyncFun();
    },
    { immediate: true },
  );

  // 监听 value 变化
  watch(
    () => value.value,
    () => {
      setKey();
    },
    { deep: true },
  );

  // 监听 tempConfig 变化
  watch(
    () => tempConfig.value,
    () => {
      setKey();
    },
    { deep: true },
  );

  return {
    tempConfig,
    setKey,
    asyncFun,
    allChange,
    itemInput,
  };
}

export default useFormCommon;
