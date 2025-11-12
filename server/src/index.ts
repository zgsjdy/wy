import express from "express"; // 导入 Express 模块，用于创建 HTTP 服务器
import cors from "cors"; // 导入 CORS 模块，用于处理跨域请求
import dataRoutes from "./routes/dataRoutes"; // 导入数据路由模块
import fileRoutes from "./routes/fileRoutes"; // 导入文件路由模块

// 创建 Express 应用实例
const app = express();
// 定义服务器端口
const port = 3001;
// 使用 CORS 中间件，允许跨域请求
app.use(cors());
// 解析 JSON 格式的请求体
app.use(express.json());

// 使用数据路由
app.use("/api", dataRoutes);
// 使用文件路由
app.use("/", fileRoutes);

// 提供静态文件服务,匹配路由失败返回的静态资源,已在文件路由中设置了
// app.use(express.static(path.join(__dirname, '../public/dist')));

// 处理 404 错误
app.use((req, res, next) => {
  res.status(404).json({ error: "未找到资源!" });
});

// 启动服务器
app.listen(port, () => {
  console.log(`http://localhost:${port}/ 服务器正在${port}端口上运行！`);
});
