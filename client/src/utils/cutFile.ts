import SparkMD5 from "spark-md5";
import { toRaw } from "vue";

/**
 * 分割文件
 * @param file 文件
 * @param index 分片索引
 * @param chunkSize 分片大小
 * @returns promise { start: number, end: number, hash: string, blob: Blob } 返回分片的起始位置，结束位置，索引，hash值，blob对象（也就是每一个分片）
 */
export function createChunk(
  file: File,
  index: number,
  chunkSize: number
): Promise<{ start: number; end: number; index: number; hash: string; blob: Blob; name: string }> {
  return new Promise((resolve) => {
    // console.log('dvdsvdsvdsvsd');
    const start = index * chunkSize; // 计算分片的起始位置
    const end = start + chunkSize; // 计算分片的结束位置

    const spark = new SparkMD5.ArrayBuffer(); // 创建 SparkMD5 实例
    const fileReader = new FileReader(); // 创建 FileReader 实例
    const blob = file.slice(start, end); // 获取文件的分片

    fileReader.onload = (e) => {
      // 当文件读取完成时的回调函数
      if (e.target) {
        spark.append(e.target.result as ArrayBuffer); // 将读取的结果追加到 SparkMD5 实例中
      }

      //这里不能直接使用FormData 进行传递，线程传递的数据会报错
      resolve({
        start, // 分片的起始位置
        end, // 分片的结束位置
        index, // 分片的索引
        hash: spark.end(), // 计算分片的 MD5 哈希值
        blob, // 分片的 Blob 对象
        name: file.name, // 文件名
      });
    };
    fileReader.readAsArrayBuffer(blob); // 读取分片的内容格式为 ArrayBuffer
  });
}

/**
 * 分割多文件数组开启多线程
 * @param {File} file - 要切成块的文件。
 * @param {number} chunkSize - 每个块的大小（以MB为单位），默认为5MB。
 * @returns {Promise<Array<{ start: number, end: number, index: number, hash: string, blob: Blob }>>} - 返回一个Blob数据的数组。
 */

export function cutFile(
  file: Array<{
    name: string;
    progress: number;
    status: "uploading" | "success" | "error" | "paused";
    errorMessage: string;
    paused: boolean;
    file: File | null;
  }>,
  chunkSize: number = 5
): Promise<Array<Array<{ start: number; end: number; index: number; hash: string; blob: Blob }>>> {
  return new Promise((resolve) => {
    // 把响应式数据转换为普通数据
    const originalF = toRaw(file); //线程通信时，不能传递响应式数据

    // 数据大小均分
    const F = averageFile(originalF);

    const THREAD_COUNT: number = navigator.hardwareConcurrency || 4; // 线程数量
    const CHUNK_SIZE: number = 1024 * 1024 * chunkSize; // 每个分片的大小(单位mb)

    // 计算每个线程的分到数组数量
    const numberOfArrays: number = Math.ceil(F.length / THREAD_COUNT);
    // 计算要开启的线程数量
    const numberOfThreads: number = Math.ceil(F.length / numberOfArrays);

    let result: Array<
      Array<{ start: number; end: number; index: number; hash: string; blob: Blob }>
    > = []; // 存储结果的数组
    let finishCount: number = 0; // 完成的线程计数

    for (let i = 0; i < numberOfThreads; i++) {
      const startArray = i * numberOfArrays; // 计算当前线程处理的起始索引
      const endArray = Math.min(startArray + numberOfArrays, F.length); // 计算当前线程处理的结束索引
      const chunkArray = F.slice(startArray, endArray); // 获取当前线程处理的文件数组

      // console.log('chunkArray', chunkArray);
      const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }); // 创建一个新的线程

      worker.postMessage({
        // 向线程发送消息
        chunkArray,
        CHUNK_SIZE,
      });

      worker.onmessage = (e) => {
        // 当线程发送消息时的回调函数
        worker.terminate(); // 关闭线程
        result[i] = e.data; // 将线程处理的结果存储到结果数组中
        finishCount++; // 增加完成的线程计数
        if (finishCount === numberOfThreads) {
          // 如果所有线程都完成了

          //@ts-ignore 上面把数组变更成三层了result[i] = e.data;这里便会两层ts会认为把两成变为一层 // 把数组的第一个元素展开
          result = result.flat();

          resolve(result); // 返回结果
        }
      };
    }
  });
}

/**
 * 数组按照指定字段大小进行平均分，让大的数据尽量分开而不是扎堆
 * * @param {Array} file - 要平分的文件数组。
 * * @returns {Array} - 返回一个新的平分好的数组。
 */
function averageFile(file: Array<any>): Array<any> {
  // 注意这里不要动原本数据会有值引用也就是变量存的是地址不是值,toRaw返回根据一个 Vue 创建的代理返回其原始对象。
  const raw = [...file];
  const result: Array<any> = [];

  raw.sort((a, b) => a.file.size - b.file.size); // 数组排序，按照文件大小进行排序，小的在前面，大的在后面

  let valueRetrieval: "Left" | "Right" = "Right";

  while (raw.length > 0) {
    if (valueRetrieval === "Left") {
      result.push(raw.shift()); // 从数组左侧取出一个元素
      valueRetrieval = "Right";
    } else {
      result.push(raw.pop()); // 从数组右侧取出一个元素
      valueRetrieval = "Left";
    }
  }

  return result;
}
