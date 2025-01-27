import { Router, Request, Response } from 'express';
import express from 'express';
import path from 'path';

// 创建路由实例
const router = Router();

// 设置静态文件目录，作为文件服务器
router.use('/files', express.static(path.join(__dirname, '../../public/dist')));

export default router;