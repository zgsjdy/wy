// server/src/config/db.ts
import mysql from 'mysql2/promise'; // 导入 mysql2/promise 模块

import dotenv from 'dotenv'; // 导入 dotenv 模块
dotenv.config(); // 加载环境变量

const pool = mysql.createPool({ // 创建一个连接池
  host: process.env.DB_HOST, // 数据库主机地址，从环境变量中获取
  user: process.env.DB_USER, // 数据库用户名，从环境变量中获取
  password: process.env.DB_PASSWORD, // 数据库密码，从环境变量中获取
  database: process.env.DB_NAME, // 数据库名称，从环境变量中获取
  waitForConnections: true, // 等待连接（如果没有可用连接）
  connectionLimit: 10, // 连接池中最大连接数
  queueLimit: 0 // 队列中最大等待连接数（0 表示不限制）
});

// console.log(process.env.DB_HOST,"fsdhfhsdjhfsjdhgfjgshdfgbvvsgf");

export default pool; // 导出连接池