<template>
    <div class="home">
      <input type="file" @change="handleFileSelect" />
      <button @click="startUpload" :disabled="!selectedFile">上传</button>
      <div v-if="uploading">
        <p>上传进度: {{ progress.toFixed(2) }}%</p>
      </div>
      <p v-if="uploadSuccess">文件上传成功</p>
      <p v-if="uploadError">{{ uploadError }}</p>
    </div>
</template>
  
<script lang="ts" setup>
import { ref } from 'vue';
import axios from 'axios';
  
  // 定义响应数据类型
  interface UploadResponse {
    message: string;
  }
  
  // 存储选中的文件
  const selectedFile = ref<File | null>(null);
  // 标识是否正在上传
  const uploading = ref(false);
  // 上传进度
  const progress = ref(0);
  // 标识上传是否成功
  const uploadSuccess = ref(false);
  // 存储上传错误信息
  const uploadError = ref('');
  
  // 处理文件选择事件
  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    selectedFile.value = target.files?.[0] || null;
  };
  
  // 开始上传文件
  const startUpload = async () => {
    if (!selectedFile.value) return;
  
    uploading.value = true;
    uploadSuccess.value = false;
    uploadError.value = '';
    progress.value = 0;
  
    // 每个切片大小为 1MB
    const chunkSize = 1024 * 1024;
    // 计算总切片数
    const totalChunks = Math.ceil(selectedFile.value.size / chunkSize);
    let uploadedChunks = 0;
  
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, selectedFile.value.size);
      // 切割文件得到切片
      const chunk = selectedFile.value.slice(start, end);
  
      const formData = new FormData();
      formData.append('file', chunk);
      formData.append('filename', selectedFile.value.name);
      formData.append('chunkIndex', i.toString());
      formData.append('totalChunks', totalChunks.toString());
  
      try {
        // 上传切片
        await axios.post<UploadResponse>('http://localhost:3000/upload', formData, {
          onUploadProgress: (progressEvent:any) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // 计算整体上传进度
            progress.value = ((uploadedChunks * 100) + percentCompleted) / totalChunks;
          }
        });
        uploadedChunks++;
      } catch (error) {
        uploading.value = false;
        if (typeof error === 'object' && error!== null && 'message' in error) {
          uploadError.value = `上传切片出错: ${(error as { message: string }).message}`;
        } else {
          uploadError.value = '上传切片出错: 未知错误';
        }
        return;
      }
    }
  
    try {
      // 发送合并切片的请求
      await axios.post<UploadResponse>('http://localhost:3000/merge', {
        filename: selectedFile.value.name,
        totalChunks
      });
      uploading.value = false;
      uploadSuccess.value = true;
    } catch (error) {
      uploading.value = false;
      if (typeof error === 'object' && error!== null && 'message' in error) {
        uploadError.value = `合并切片出错: ${(error as { message: string }).message}`;
      } else {
        uploadError.value = '合并切片出错: 未知错误';
      }
    }
  };
</script>

<style scoped lang="scss">
.home {
    text-align: center;
    margin-top: 50px;
}
</style>