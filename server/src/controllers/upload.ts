import { Request, Response } from 'express';
import multer from 'multer';// 导入 multer 模块，用于处理文件上传
import fs from 'fs';// 导入 fs 模块，用于处理文件系统操作
import path from 'path';// 导入 path 模块，用于处理文件路径



// 确保 temp 文件夹存在,同步方法
const tempDir = path.join(__dirname, '../../temp__LLL');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

// 确保 resources 文件夹存在,同步方法
const resources = path.join(__dirname, '../../resources__WWW');
if (!fs.existsSync(resources)) {
    fs.mkdirSync(resources);
}

// 自定义 multer 存储引擎
const storage = multer.diskStorage({
    destination: (req, _, cb) => {
        // 从请求体中获取 name 字段
        const name = req.body?.name;
        if (!name) {
          //@ts-ignore
          return cb(new Error('请求体中缺少 name 字段'), null);
        }
        // 生成存储路径
        const destDir = path.join(tempDir, name);
        // 若目标文件夹不存在，则创建它
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir);
        }
        cb(null, destDir);
    },
    filename: (req, file, cb) => {
        // 使用原始文件名作为分片文件名
        cb(null, `${req.body.index}_${req.body.hash}_${file.originalname}`);
    }
});
// 创建 multer 实例
const up = multer({ storage: storage });



// 配置 upload.fields
const fieldsConfig = [
  { name: 'start', maxCount: 1 },
  { name: 'end', maxCount: 1 },
  { name: 'index', maxCount: 1 },
  { name: 'hash', maxCount: 1 },
  { name: 'name', maxCount: 1 },
  { name: 'blob', maxCount: 1 }
];



/**
 * 合并文件夹中的所有 Blob 文件
 * @param {string} folderPath - 文件夹路径
 * @param {string} outputPath - 合并后文件的输出路径
 */
function mergeBlobs(folderPath: string, outputPath: string,name: string) {
  try {
      // 检查文件夹是否存在
      if (!fs.existsSync(folderPath)) {
          throw new Error(`文件夹不存在: ${folderPath}`);
      }

      // 读取文件夹中的所有文件
      const files = fs.readdirSync(folderPath);

      // 按文件名排序（假设文件名中包含索引，如 "0_chunk", "1_chunk"）
      const sortedFiles = files.sort((a, b) => {
          const indexA = parseInt(a.split('_')[0], 10); // 提取索引
          const indexB = parseInt(b.split('_')[0], 10);
          return indexA - indexB;
      });

      // 创建一个空数组用于存储所有 Buffer
      const buffers = [];

      // 遍历排序后的文件，读取每个文件的内容为 Buffer
      for (const file of sortedFiles) {
          const filePath = path.join(folderPath, file);

          // 检查是否为文件
          const stats = fs.statSync(filePath);
          if (!stats.isFile()) {
              console.warn(`跳过非文件项: ${filePath}`);
              continue;
          }

          const buffer = fs.readFileSync(filePath); // 读取文件内容为 Buffer
          buffers.push(buffer);
      }

      // 合并所有 Buffer
      const mergedBuffer = Buffer.concat(buffers);
      console.log(`合并后的 Buffer 长度: ${mergedBuffer.length}`);

      // 构造完整的文件路径
      const filePath = path.join(outputPath,name);

      // 将合并后的 Buffer 写入目标文件
      fs.writeFileSync(filePath, mergedBuffer);

      console.log(`文件合并成功，已保存到: ${outputPath}`);
  } catch (error: any) {
      console.error('文件合并失败:', error.message);
  }
}

/**
 * 删除文件夹及其内部所有文件
 * @param {string} folderPath - 要删除的文件夹路径
 */
function deleteFolder(folderPath: string) {
  try {
      // 检查文件夹是否存在
      if (fs.existsSync(folderPath)) {
          // 递归删除文件夹及其内容
          fs.rmSync(folderPath, { recursive: true, force: true });
          console.log(`文件夹已成功删除: ${folderPath}`);
      } else {
          console.log(`文件夹不存在: ${folderPath}`);
      }
  } catch (error: any) {
      console.error(`删除文件夹失败: ${error.message}`);
  }
}

// 合并分片函数
function merge(req: Request, res: Response): void {
  const { hash, name, index } = req.body;
  
  const filePath = path.join(tempDir, name);
  
  mergeBlobs(filePath,resources,name)

  // 删除临时分片 
  deleteFolder(filePath);
  
  res.status(200).send('文件合并成功');
}



export function upload(req: Request, res: Response) {
  
  const option = req.query?.option;

  switch (option) {
    case undefined:
      
    up.fields(fieldsConfig)(req, res, (err) => {
      if(err){
        res.status(400).send('文件上传失败');
      }
    
      setTimeout(() => {
        res.send('文件上传成功');
      },Math.random() * 1000);
    });

    break;


    case 'merge':
      merge(req, res)  // 合并分片
    break;

  
    default:
      res.status(400).send('无效的 key');
      break;
  }
    
}










