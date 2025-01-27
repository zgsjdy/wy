import express from 'express';
import cors from 'cors';
import path from 'path';
import dataRoutes from './routes/dataRoutes';
import fileRoutes from './routes/fileRoutes';

// 创建 Express 应用实例
const app = express();
// 使用 CORS 中间件，允许跨域请求
// app.use(cors());
// 解析 JSON 格式的请求体
app.use(express.json());

// 使用数据路由
app.use('/api', dataRoutes);
// 使用文件路由
app.use('/', fileRoutes);

// 提供静态文件服务
app.use(express.static(path.join(__dirname, '../public/dist')));

// 处理前端路由
app.get('/Home', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dist', 'index.html'));
});

app.get('/Home2', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dist', 'index.html'));
});

// 定义服务器端口
const port = 3001;
// 启动服务器
app.listen(port, () => {
  console.log(`http://localhost:${port}/ 服务器正在${port}端口上运行！`);
});