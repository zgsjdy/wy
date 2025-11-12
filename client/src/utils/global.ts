/**
 * 这只是副作用模块，只运行不需要值
 * 只是挂载一些全局属性
 */

/* 定义全局对象属性值的类型 */
interface ResultType {
  ish5?: boolean;
  [key: string]: any;
}
/* 定义直接使用 $gl 和 window.$gl 属性的类型 */
declare global {
  interface Window {
    $gl: ResultType;
  }
  const $gl: Window["$gl"];
}
const result: ResultType = {};

// 初始化运行区域

Object.defineProperties(result, {
  //需要不能修改的属性，可写多个
  ish5: {
    value: /(iPhone|iPad|iPod|iOS|Android|Windows Phone|BlackBerry|SymbianOS|Harmony)/i.test(
      navigator.userAgent
    ),
    writable: false,
    configurable: false,
    enumerable: true,
  },
});

// 挂载
Object.defineProperty(window, "$gl", {
  value: result,
  writable: false,
  configurable: false,
  enumerable: true,
});
