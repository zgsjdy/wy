import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "./", // 设置打包后路径为相对路径
  server: {
    // host: "192.168.1.132",
    // port: 8080,
  },
});
