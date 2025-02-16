/**
 * 闭包防抖函数
 * @param {(...args: any[]) => void} fn - 需要防抖处理的函数
 * @param {number} wait - 等待时间，单位为毫秒
 * @returns {(...args: any[]) => void} - 返回一个新的函数(这个函数是防抖函数，调用这个函数有防抖效果)，接收任意数量的参数
 */
export function antiShake(fn: (...args: any[]) => void, wait: number): (...args: any[]) => void{
    // 定义一个定时器变量，初始值为null
    let timer: ReturnType<typeof setTimeout> | null = null;
    // 返回一个新的函数，接收任意数量的参数
    return function (...args: any[]) {
      // 参数校验
      if (typeof fn !== 'function') {
        throw new Error('fn必须是函数');
      }
      if (typeof wait !== 'number' || wait < 0) {
        throw new Error('wait必须是非负数');
      }
      // 如果定时器存在，则清除定时器
      if (timer) {
        clearTimeout(timer);
      }
      // 设置一个新的定时器，在wait毫秒后执行fn函数，并传入参数args
      timer = setTimeout(() => {
        fn(...args);
      }, wait);
    };
}








  