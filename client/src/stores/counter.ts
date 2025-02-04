import { defineStore } from 'pinia';

// 定义状态的类型
interface CounterState {
    count: number;
    uploadData: Array<{
        name: string;
        progress: number;
        status: 'uploading' | 'success' | 'error' | 'paused';
        errorMessage: string;
        paused: boolean;
        file: File | null;
    }>;
}

// 定义一个名为 counter 的 store
export const useStore = defineStore('counter', {
    // 状态定义，返回一个包含状态数据的对象
    state(): CounterState {
        return {
            count: 0,
            // 大文件上传数据
            uploadData: []
        };
    },
    // getters 类似于计算属性，用于获取派生状态
    getters: {
        doubleCount: (state) => state.count * 2
    },
    // actions 用于修改状态，可以是同步或异步操作
    actions: {
        increment() {
            this.count++;
        },
        async incrementAsync() {
            // 模拟异步操作
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.count++;
        }
    }
});