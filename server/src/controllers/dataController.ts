import { Request, Response } from "express";
import pool from "../models/db";

// 获取数据的控制器方法
export const getData = async (req: Request, res: Response) => {
  try {
    // 从连接池获取连接
    const connection = await pool.getConnection();

    // 执行 SQL 查询
    const [rows] = await connection.execute("SELECT * FROM baoxiou");
    // 释放连接
    connection.release();
    // 返回查询结果,这里模拟一下延迟
    setTimeout(() => {
      res.json(rows); // 返回查询结果
    }, Math.random() * 1000);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "内部服务器无数据!" });
  }
};
