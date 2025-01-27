import { Router, Request, Response } from 'express';
import { getData } from '../controllers/dataController';

// 创建路由实例
const router = Router();

// 定义获取数据的路由
router.get('/data', getData);

export default router;