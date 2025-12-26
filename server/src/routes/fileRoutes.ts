import { Router, Request, Response } from "express";
import express from "express";
import path from "path";
import { upload } from "../controllers/upload";

// 创建路由实例
const router = Router();

// 设置静态文件目录，作为文件服务器
router.use("/", express.static(path.join(__dirname, "../../public/dist")));

// 处理前端路由,(在window下路由不区分大小写)
router.get(["/uploadLargeFiles", "/other"], (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/dist", "index.html"));
});

// 处理大文件分片上传
router.post("/upload", upload);

export default router;
