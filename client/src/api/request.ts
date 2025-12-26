import send from "./index";
import type { AxiosRequestConfig } from "axios";

/**
 * 上传文件分片请求
 * @param formData FormData对象
 * @return Promise
 */
export const uploadFileChunk = (formData: { [key: string]: any }, option?: AxiosRequestConfig) =>
  send.post("/upload", formData, option);

/**
 * 请求数据库信息 = > 无参数
 * @returns Promise
 */
export const getDatabaseInfo = () => send.get("/api/data");
