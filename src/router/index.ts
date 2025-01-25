import { createRouter, createWebHistory } from "vue-router";
// 使用仅类型导入在导入 RouteRecordRaw 类型时，运用仅类型导入语法 import type
import type { RouteRecordRaw } from "vue-router";
// 导入路由组件



// 使用 RouteRecordRaw 类型定义路由配置
const routes: Array<RouteRecordRaw> = [
    {
        path: "/",
        name: "Home",
        component: () => import("../views/home.vue"), // 懒加载组件
        props: true // 将路由参数作为 props 传递
    }
];


const router = createRouter({
    history: createWebHistory(),  //使用html5 history模式(无#历史记录)
    routes,
});

export default router;











