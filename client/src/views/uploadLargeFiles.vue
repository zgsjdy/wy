<template>
  <div class="upload-container">
    <h2>
      大文件,动态多线程分片，多并发，断网继传，多文件，上传<span class="animLoad" v-if="!!Load">{{
        Load
      }}</span>
    </h2>
    <!-- 拖拽区域 注意：必须同时阻止dragover和drop的默认行为才能实现自定义放置-->
    <div
      class="drop-zone"
      @dragover.prevent
      @dragenter="handleDragenter"
      @dragleave="handleDragleave"
      @drop="handleDrop"
      :class="disabled"
    >
      <p class="drop-zone-text">
        将文件拖拽到此处上传或者点击上传（当前总文件数量：{{ P.uploadData.length }}）
      </p>
      <input type="file" multiple @change="handleFileSelect" class="file-input" draggable="false" />
    </div>

    <!-- 已选择文件列表及上传状态展示区域 -->
    <div v-for="(file, index) in P.uploadData" :key="index" class="upload-task">
      <div class="task-header">
        <p class="task-filename">{{ file.name }}</p>
        <div class="task-actions">
          <button
            @click="pauseUpload(index)"
            :disabled="file.status === 'success' || file.status === 'error'"
          >
            {{ file.paused ? "继续上传" : "暂停上传" }}
          </button>
          <button
            @click="cancelUpload(index)"
            :disabled="file.status === 'success' || file.status === 'error'"
          >
            取消上传
          </button>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="progress-bar">
        <div class="progress" :style="{ width: `${file.progress}%` }"></div>
      </div>
      <p v-if="file.status === 'success'" class="task-status success">上传成功</p>
      <p v-if="file.status === 'error'" class="task-status error">{{ file.errorMessage }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
/* 部分代码绕弯路是为了用到各种技术 */
import { ref, watch, onMounted, onUnmounted, type Ref } from "vue";
import { cutFile } from "../utils/cutFile"; // 引入文件切片函数
import { uploadFileChunk } from "../api/request"; // 引入 请求函数
import { useStore } from "../stores/counter"; // 引入 pinia store
const P = useStore(); // 使用 pinia store
import { antiShake } from "../utils/antiShake"; // 引入公共防抖函数

// 是否开启禁用上传状态展示区域
let disabled: Ref<string> = ref("");

// 处理文件选择事件 input
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement; // 获取事件目标并断言为 HTMLInputElement
  if (target.files) {
    // 检查是否有文件被选择
    const files = Array.from(target.files); // 将文件列表转换为数组
    files.forEach((file) => {
      // 遍历每个文件
      // 判断有无重复文件名（简单判断）
      const isDuplicate = P.uploadData.some((task) => task.name === file.name);
      if (!isDuplicate) {
        P.uploadData.push({
          // 将文件信息添加到上传任务列表中
          name: file.name, // 文件名
          progress: 0, // 上传进度初始化为 0
          status: "uploading", // 上传状态初始化为 'uploading'
          errorMessage: "", // 错误信息初始化为空
          paused: false, // 暂停状态初始化为 false
          file,
        });
      }
    });
  }
};

// 拖住进入元素事件
const handleDragenter = (e: DragEvent) => {
  (e.target as HTMLElement).style.backgroundColor = "#ff8f8f";
};

// 拖住退出元素事件
const handleDragleave = (e: DragEvent) => {
  (e.target as HTMLElement).style.backgroundColor = "";
};

// 处理文件拖拽松手事件，注意：必须同时阻止dragover和drop的默认行为才能实现自定义放置
const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    const items = Array.from(event.dataTransfer.items); //事件运行完将无法读取值，所以需要转数组
    items.forEach((item) => {
      const entry = item.webkitGetAsEntry(); //读取拖拽的文件,来确认是否是文件夹
      if (entry && entry.isDirectory) {
        console.log(
          "%c isDirectory ::===>>> 文件夹将不做处理！",
          `font-size:16px;
           border-radius: 3px;
           font-weight: bold;
           background:#7cd7f7;
           color:#8641d2;`
        );
        return;
      }

      const file = item.getAsFile(); //读取file
      if (file) {
        // 判断有无重复文件名（简单判断）
        const isDuplicate = P.uploadData.some((task) => task.name === file.name);
        if (!isDuplicate) {
          P.uploadData.push({
            name: file.name,
            progress: 0,
            status: "uploading",
            errorMessage: "",
            paused: false,
            file,
          });
        }
      }
    });
  }
  (event.target as HTMLElement).style.backgroundColor = "";
};

//记录上传任务
let map: Array<{
  name: string;
  index: number;
  hash: string;
}> = [];

// 防抖函数，注意这个函数用到了全局变量
const pauseUp = antiShake((index: number, thread: number) => {
  if (!P.uploadData[index].paused) {
    // 这里可以把前端记录的最后一次记录发请求给后端对比最后一个哈希值，对的上就继续上传，对不上服务器返回该文件的最后一个分片参数等等，要是没有重新上传该文件
    // 略...这里就不发请求了，前端记录的一般不会错，有时间在把这个补上

    // 判断对象有没有值
    if (map[index]) {
      // 解构map
      const mapObj: { name: string; index: number; hash: string } = map[index];
      const { name, index: subscript, hash } = mapObj;

      uploadShards(resUploadData[index], index, subscript + 1, thread); //加一是跳过已经上传的分片
      // console.log("暂停的map",subscript+1,hash,name,map)
    } else {
      uploadShards(resUploadData[index], index, 0, thread); // 继续上传
    }
  }
}, 300);

// 暂停上传
const pauseUpload = (index: number) => {
  P.uploadData[index].paused = !P.uploadData[index].paused;
  P.uploadData[index].status = P.uploadData[index].paused ? "paused" : "uploading";

  pauseUp(index, 2);
};

// 取消上传
const cancelUpload = (index: number) => {
  P.uploadData[index].status = "error";
  P.uploadData[index].errorMessage = "上传已取消";
  // console.log(P.uploadData)
};

// 监听网络状态
const handleOnline = () => {
  alert("已经恢复！");
  let onePaused: number = -1;
  // 把所有文件上传修改为继续
  P.uploadData.forEach((task, index) => {
    if (task.status === "paused") {
      P.uploadData[index].paused = !P.uploadData[index].paused;
      P.uploadData[index].status = P.uploadData[index].paused ? "paused" : "uploading";
      if (onePaused === -1) onePaused = index;
    }
  });

  //继续上传
  uploadFile(resUploadData, onePaused, 2, { index: 0, concurrentNumber: 2 });
};

const handleOffline = () => {
  alert("网络已断开！");
  // 把所有文件上传修改为暂停
  P.uploadData.forEach((task, index) => {
    if (task.status === "uploading") {
      P.uploadData[index].paused = !P.uploadData[index].paused;
      P.uploadData[index].status = P.uploadData[index].paused ? "paused" : "uploading";
    }
  });
};

// 防止多次监听
onMounted(() => {
  // 添加监听
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
});

onUnmounted(() => {
  // 清空map数组和resUploadData数组
  map = [];
  resUploadData = [];
  P.uploadData.length = 0;
  // 移除监听
  window.removeEventListener("online", handleOnline);
  window.removeEventListener("offline", handleOffline);
});

// 上传文件

// 创建 AbortController 实例，用于取消请求
/*****
const controller = new AbortController();
const signal = controller.signal;

if(P.uploadData[id].status === 'error'){
  // 取消请求
  controller.abort();
}
*****/

/**
 * 单个文件并发请求上传文件分片，只是并发上传分片，上传完分片后，再请求合并分片，
 * 文件上传状态只要不是"uploading"都会返回失败的Promise
 * @param shards 分片数组数据，需要同一个文件的所有分片数据
 * @param id 文件索引代表这个是第几个文件，需要判断当前文件是否需要上传 注意：用到了全局变量
 * @param index 当前上传的分片索引
 * @param concurrentNumber 并发上传数量
 * @return Promise<any> 不是上传时候失败的比如断网会直接返回成功的Promise
 */
const uploadShards = (
  shards: any[],
  id: number,
  index: number = 0,
  concurrentNumber: number = 5
) => {
  return new Promise((resolve, reject) => {
    if (P.uploadData[id].status !== "uploading") {
      reject(
        `文件上传状态不是 uploading ：id_${id},index_${index},name_${shards[0].name},errorMessage_${P.uploadData[id].errorMessage}`
      );
      return;
    }
    console.log("上传分片", index);
    // 并发请求
    let response: Promise<any>[] = [];
    let loop =
      concurrentNumber >= shards.length
        ? shards.length
        : Math.min(index + concurrentNumber, shards.length);

    for (let i = index; i < loop; i++) {
      const formData = new FormData();
      formData.append("start", shards[i].start.toString());
      formData.append("end", shards[i].end.toString());
      formData.append("index", shards[i].index.toString());
      formData.append("hash", shards[i].hash);
      formData.append("name", shards[i].name);
      formData.append("blob", shards[i].blob); //注意文件数据要在最后把其它文本字段放后面会导致multer引擎里面会读取不了

      response.push(uploadFileChunk(formData));

      // console.log(formData,index)
    }

    // 注意all传空数组会返回成功Promise
    Promise.all(response)
      .then(async (_) => {
        // 防止暂停或取消后，请求没有及时返回但是这个请求是暂停前发出去的所以这个也算是上传成功，这里让页面不动数据动
        if (P.uploadData[id].status === "uploading") {
          // 更新上传进度，因为返回的数组是根据下标插入的，所以顺序是一样的
          P.uploadData[id].progress = shards.length === 1 ? 50 : (index / shards.length) * 100 - 1;
        }

        // console.log(index,loop)
        // 更新上传索引
        index = loop;

        //记录文件名和最后一个上传的分片索引，和哈希值
        map[id] = {
          name: shards[0].name,
          index: shards[index - 1].index,
          hash: shards[index - 1].hash,
        };

        // 上传下一个任务
        if (index < shards.length) {
          uploadShards(shards, id, index, concurrentNumber)
            .then((result) => {
              resolve(result); // 上传成功，解析Promise
            })
            .catch((error) => {
              reject(error); // 上传失败，拒绝Promise
            });
        } else {
          try {
            await uploadFileChunk(map[id], {
              params: {
                option: "merge",
              },
            });
            // 更新上传进度，因为返回的数组是根据下标插入的，所以顺序是一样的
            P.uploadData[id].progress = 100;

            // 更新成功状态
            P.uploadData[id].status = "success";

            resolve({ id, name: shards[0].name });
          } catch (err) {
            // 更新失败状态
            P.uploadData[id].status = "error";
            P.uploadData[id].errorMessage = "上传文件合成失败";
            // 抛出失败的Promise
            reject(`文件上传合并失败id_${id},index_${index},name_${shards[0].name} :${err}`);
          }
        }
      })
      .catch((err) => {
        // 这里判断状态是为了防止文件上传状态不对报错，暂停等情况，不修改页面状态为错误类型
        if (P.uploadData[id].status === "uploading") {
          // 更新失败状态
          P.uploadData[id].status = "error";
          P.uploadData[id].errorMessage = "上传失败";
        }
        // 抛出失败的Promise
        reject(`文件上传失败id_${id},index_${index},name_${shards[0].name} :${err}`);
      });
  });
};

/**
 * 并发上传文件，并发上传单文件，调用并发分片上传函数
 * @param arr 文件数组数据 => 进行分片处理后的
 * @param index 当前上传的文件索引
 * @param currentNumber 并发上传文件数量
 * @param toConfigureShards 并发分片上传函数，配置对象
 * @param {number} [toConfigureShards.index] 当前上传的分片索引
 * @param {number} [toConfigureShards.concurrentNumber] 并发上传数量
 * @returns Promise<any>
 */
const uploadFile = (
  arr: Array<Array<{ start: number; end: number; index: number; hash: string; blob: Blob }>>,
  index: number = 0,
  currentNumber: number = 2,
  toConfigureShards: {
    index?: number;
    concurrentNumber?: number;
  }
) => {
  return new Promise((resolve, reject) => {
    // 结构toConfigureShards配置项
    let { index: subscript, concurrentNumber: current } = toConfigureShards;

    // 并发请求
    let respon: Promise<any>[] = [];
    let loop =
      currentNumber >= arr.length ? arr.length : Math.min(index + currentNumber, arr.length);

    for (let i = index; i < loop; i++) {
      // 判断是否需要上传
      if (P.uploadData[i].status !== "uploading") {
        continue;
      }

      // 判断是否有保存的分片记录
      if (map[i]) {
        subscript = map[i].index + 1; //加一 下一个分片索引
        if (subscript) console.warn(`有保存的分片记录，从${subscript}开始上传,不使用函数传入值`);
      }

      //并发请求并发上传函数
      respon.push(uploadShards(arr[i], i, subscript, current));
      // console.log(respon)
    }

    // 可用allSettled方法，代替all 这样有报错就不会中断了，但是兼容性不好 注意all传空数组会返回成功Promise
    Promise.all(respon)
      .then((res) => {
        // 记录上传成功的切片索引
        index = loop;

        // 如果还有剩余的文件，继续上传
        if (index < arr.length) {
          uploadFile(arr, index, currentNumber, toConfigureShards)
            .then((result) => {
              resolve(result); // 上传成功，解析Promise
            })
            .catch((error) => {
              reject(error); // 上传失败，拒绝Promise
            });
        } else {
          resolve(res); // 上传成功，解析Promise
        }
      })
      .catch((err) => {
        /* 兼容性较好的代替allSettled方法，这样有报错就不会中断了 */

        // 跳过错误的并发文件，继续上传
        index = loop;
        console.warn(`跳过错误文件 ${index} 继续上传`);

        // 如果还有剩余的文件，继续上传
        if (index < arr.length) {
          uploadFile(arr, index, currentNumber, toConfigureShards)
            .then((result) => {
              resolve(result); // 上传成功，解析Promise
            })
            .catch((error) => {
              reject(error); // 上传失败，拒绝Promise
            });
        } else {
          reject(`文件数组上传失败，错误信息 :${err}`);
        }
      });
  });
};

// 监控数据是否一选择完毕
let Load: Ref = ref("");

let resUploadData: Array<
  Array<{ start: number; end: number; index: number; hash: string; blob: Blob }>
>;
watch(
  () => P.uploadData.length,
  async () => {
    // 只能选择一次文件,选择完毕后禁用上传
    disabled.value = "disabled";
    // console.log(P.uploadData)

    Load.value = " ⚡⚡⚡处理中...";

    resUploadData = await cutFile(P.uploadData, 6);
    Load.value = "";
    if (resUploadData?.length === 0) {
      // 处理失败，请重试！
      disabled.value = "";
      return;
    }

    console.log("分片完成", resUploadData);

    try {
      await uploadFile(resUploadData, 0, 2, { index: 0, concurrentNumber: 2 }); //并发多文件上传文件，即使文件上传有暂停会跳过所以用await不会等待暂停上传的文件
      console.log("map", map);
      disabled.value = "";
    } catch (error) {
      // 抛出错误
      disabled.value = "";
      console.error(`watch回调函数报错:${error}`);
    }
  }
);
</script>

<style lang="scss" scoped>
// 加载动画
@keyframes animLoad {
  0% {
    opacity: 0;
    transform: scale(0.8, 0.8);
  }
  100% {
    opacity: 1;
    transform: scale(0.9, 0.9);
  }
}
.animLoad {
  display: inline-block;
  // transform-origin: top center;
  animation: animLoad 1s linear infinite;
}

.upload-container {
  width: 90%;
  height: 90%;
  margin: 2% auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  overflow-y: scroll;
  color: #fff;

  .drop-zone {
    transition: all 0.3s;
    border: 2px dashed #ccc;
    border-radius: 5px;
    padding: 30px;
    text-align: center;
    cursor: pointer;

    .drop-zone-text {
      font-size: 18px;
      color: #666;
      user-select: none;
    }

    .file-input {
      text-align: center;
      user-select: none;
    }
  }

  .disabled {
    pointer-events: none; /* 表示禁用状态 */
    opacity: 0.2;
  }

  .upload-task {
    margin-top: 20px;
    border: 1px solid #eee;
    border-radius: 5px;
    padding: 15px;

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .task-filename {
        font-size: 16px;
        font-weight: bold;
        word-wrap: break-word;
        word-break: break-all;
      }

      .task-actions {
        // flex: 0 0 auto;
        display: flex;

        button {
          margin-left: 10px;
          padding: 5px 10px;
          border: none;
          border-radius: 3px;
          background-color: #007bff;
          color: white;
          cursor: pointer;
          transition: background-color 0.3s ease;
          user-select: none;

          &:hover {
            background-color: #0056b3;
          }

          &:disabled {
            background-color: #ccc;
            cursor: not-allowed;
          }
        }
      }
    }

    .progress-bar {
      height: 10px;
      background-color: #f0f0f0;
      border-radius: 5px;
      margin-top: 10px;

      .progress {
        height: 100%;
        background-color: #007bff;
        border-radius: 5px;
        transition: all 0.5s ease;
      }
    }

    .task-status {
      margin-top: 10px;
      font-size: 14px;

      &.success {
        color: green;
      }

      &.error {
        color: red;
      }
    }
  }
}
</style>
