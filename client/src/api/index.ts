import axios from "axios";

// 创建 axios 实例
const send = axios.create({
  baseURL: "http://localhost:3568/",
  // baseURL: "http://192.168.1.132:3568/",
  // baseURL: "https://4357a69c.r17.cpolar.top/",
  timeout: 30000, // 请求超时时间
  withCredentials: true, // 跨域请求时发送 cookies
});

// console.log("基础地址:", send.defaults.baseURL);

// 请求拦截器
send.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    console.error("请求配置错误:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
send.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    return response;
  },
  (error) => {
    // 对响应错误做点什么
    return Promise.reject(error);
  }
);

export default send;
