<template>
  <div class="upload-container">
    <h2>大文件,动态多线程，动态多并发，断网继传<span class="animLoad" v-if="!!Load">{{ Load }}</span></h2>
    <!-- 拖拽区域 -->
    <div class="drop-zone" @dragover.prevent @drop="handleDrop" :class="disabled">
      <p class="drop-zone-text">将文件拖拽到此处上传或者点击上传（当前总文件数量：{{ P.uploadData.length }}）</p>
      <input type="file" multiple @change="handleFileSelect" class="file-input" draggable="false" />
    </div>


    <!-- 已选择文件列表及上传状态展示区域 -->
    <div v-for="(file, index) in P.uploadData" :key="index" class="upload-task">
      <div class="task-header">
        <p class="task-filename">{{ file.name }}</p>
        <div class="task-actions">
          <button @click="pauseUpload(index)" :disabled="file.status === 'success' || file.status === 'error'">
            {{ file.paused ? '继续上传' : '暂停上传' }}
          </button>
          <button @click="cancelUpload(index)"
            :disabled="file.status === 'success' || file.status === 'error'">取消上传</button>
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
import { ref, watch, onMounted, onUnmounted, type Ref} from 'vue';
import { cutFile } from '../utils/cutFile'; // 引入文件切片函数
import axios from 'axios'; // 引入 axios
import { useStore } from '../stores/counter'; // 引入 pinia store
const P = useStore(); // 使用 pinia store


// 是否开启禁用上传状态展示区域
let disabled = ref('')



// 处理文件选择事件
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement; // 获取事件目标并断言为 HTMLInputElement
  if (target.files) { // 检查是否有文件被选择
    const files = Array.from(target.files); // 将文件列表转换为数组
    files.forEach(file => { // 遍历每个文件
      // 判断有无重复文件名（简单判断）
      const isDuplicate = P.uploadData.some(task => task.name === file.name);
      if(!isDuplicate){
        P.uploadData.push({ // 将文件信息添加到上传任务列表中
        name: file.name, // 文件名
        progress: 0, // 上传进度初始化为 0
        status: 'uploading', // 上传状态初始化为 'uploading'
        errorMessage: '', // 错误信息初始化为空
        paused: false, // 暂停状态初始化为 false
        file
      });
      }
      
    });
  }
};

// 处理文件拖拽事件
const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    const items = Array.from(event.dataTransfer.items);
    items.forEach(item => {
      const entry = item.webkitGetAsEntry();
      if (entry && entry.isDirectory) {
        // alert("无法上传文件夹！")
        return;
      }
      const file = item.getAsFile();
      if (file) {
        // 判断有无重复文件名（简单判断）
        const isDuplicate = P.uploadData.some(task => task.name === file.name);
        if (!isDuplicate) {
          P.uploadData.push({
            name: file.name,
            progress: 0,
            status: 'uploading',
            errorMessage: '',
            paused: false,
            file
          });
        }
      }
    });
  }
};

// 暂停上传
const pauseUpload = (index: number) => {
  P.uploadData[index].paused = !P.uploadData[index].paused;
  P.uploadData[index].status = P.uploadData[index].paused ? 'paused' : 'uploading';
};

// 取消上传
const cancelUpload = (index: number) => {
  P.uploadData[index].status = 'error';
  P.uploadData[index].errorMessage = '上传已取消';
  // console.log(P.uploadData)
};



// 监听网络状态
const handleOnline = () => {
  alert('已经恢复！');
};
// 防止多次监听
onMounted(() => {
  window.addEventListener('online', handleOnline);
});

onUnmounted(() => {
  window.removeEventListener('online', handleOnline);
});





// 上传文件
let map:Array<{
  name:string,
  index:number,
  hash:string
}> = [];  //记录上传任务
const uploadShards = (shards: any[],id:number, index:number = 0, concurrentNumber: number = 5) => {
  return new Promise((resolve,reject)=>{
     // 并发请求
    let response: Promise<any>[] = [];
    let loop = concurrentNumber >= shards.length ? shards.length : Math.min(index + concurrentNumber, shards.length);
    for(let i = index; i < loop; i++){
      const formData = new FormData();
      formData.append('start', shards[i].start.toString());
      formData.append('end', shards[i].end.toString());
      formData.append('index', shards[i].index.toString());
      formData.append('hash', shards[i].hash);
      formData.append('blob', shards[i].blob);
      formData.append('name', shards[i].name);
      
      // response.push(axios.post('http://localhost:3001/upload', formData));
      response.push(axios.get('http://localhost:3001/api/data'));
      
      // console.log(formData,index)
    }
    
    Promise.all(response).then((_) => {
      
      // 更行上传进度，因为返回的数组是根据下标插入的，所以顺序是一样的
      P.uploadData[id].progress = index / shards.length * 100;
      
      // console.log(index,loop)
      // 更新上传索引
      index = loop;

      //记录文件名和最后一个上传的分片索引，和哈希值
      map[id] = { name:shards[0].name, index: shards[index-1].index, hash: shards[index-1].hash };

      // 上传下一个任务
      if(index < shards.length){
        uploadShards(shards, id, index, concurrentNumber).then((result) => {
            resolve(result); // 上传成功，解析Promise
        })
        .catch((error) => {
            reject(error); // 上传失败，拒绝Promise
        });
      }else{
        // 更行上传进度，因为返回的数组是根据下标插入的，所以顺序是一样的
        P.uploadData[id].progress = index / shards.length * 100;
        // 更新成功状态
        P.uploadData[id].status = 'success';
        
        resolve({id,name:shards[0].name}); 
        
      }
    }).catch((err) => {
      // 更新失败状态
      P.uploadData[id].status = 'error';
      P.uploadData[id].errorMessage = '上传失败';
      // 抛出失败的Promise
      reject(`文件上传失败id_${id},index_${index},name_${shards[0].name} :${err}`);
    })
 

  })
  
};


// 并发上传文件
const uploadFile = (
  arr: Array<Array<{ start: number; end: number; index: number; hash: string; blob: Blob; }>>, 
  index: number = 0, 
  currentNumber: number = 2,
  toConfigureShards:{
    index?:number, 
    concurrentNumber?: number
  }
) => {
  return new Promise((resolve, reject) => {
    // 结构toConfigureShards配置项
    const { index: subscript, concurrentNumber: current } = toConfigureShards;

    // 并发请求
    let respon: Promise<any>[] = [];
    let loop = currentNumber >= arr.length ? arr.length : Math.min(index + currentNumber, arr.length);

    for (let i = index; i < loop; i++) {
      //并发请求并发上传函数
      respon.push(uploadShards(arr[i], i, subscript, current));
      // console.log(respon)
    }

    Promise.all(respon).then((res) => {
      // 记录上传成功的切片索引
      index = loop;

      // 如果还有剩余的切片，继续上传
      if(index < arr.length){
        uploadFile(arr, index, currentNumber, toConfigureShards).then((result) => {
          
            resolve(result); // 上传成功，解析Promise
        })
        .catch((error) => {
            reject(error); // 上传失败，拒绝Promise
        });
      }else{

        resolve(res); // 上传成功，解析Promise
        
      }
      
    }).catch((err) => {
      // 抛出失败的Promise
      reject(`文件数组上传失败，错误信息 :${err}`);

    })
  });

};




// 监控数据是否一选择完毕
let Load:Ref = ref("");

let resUploadData: Array<Array<{ start: number; end: number; index: number; hash: string; blob: Blob; }>>;
watch(()=>P.uploadData.length, async ()=>{
  // 只能选择一次文件,选择完毕后禁用上传
  disabled.value = "disabled";
  // console.log(P.uploadData)


  Load.value = " ⚡⚡⚡加载中...";
  
  resUploadData = await cutFile(P.uploadData,6);
  Load.value = "";
  if(resUploadData.length === 0){
    disabled.value = ":加载失败，请重试！";
  }
  
  console.log("分片完成",resUploadData)
  
  try {
    await uploadFile(resUploadData, 0, 2,{ index:0, concurrentNumber:2 });  //并发多文件上传文件
    console.log("map",map)
  } catch (error) {
    // 抛出错误
    throw new Error(`函数报错:${error}`);
  }
  
  

})













</script>

<style lang="scss" scoped>
// 加载动画
@keyframes animLoad {
  0% {
    opacity: 0;
    transform: scale(0.8,0.8);
  }
  100% {
    opacity: 1;
    transform: scale(0.9,0.9);
  }
}
.animLoad{ 
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

  .drop-zone {
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
    pointer-events: none;/* 表示禁用状态 */
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
      }

      .task-actions {
        display: flex;

        button {
          margin-left: 10px;
          padding: 5px 10px;
          border: none;
          border-radius: 3px;
          background-color: #007BFF;
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
        background-color: #007BFF;
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
