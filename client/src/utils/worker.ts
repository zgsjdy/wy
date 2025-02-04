import { createChunk } from "./cutFile";

onmessage = async (e) => {
    // console.log('进入worker');
    const { chunkArray, CHUNK_SIZE } = e.data;  // 获取传递的数据
    let result:Array<Array<{ start: number, end: number, index: number, hash: string, blob: Blob, name: string }>> = []; // 存储结果的数组
    for(let j = 0; j < chunkArray.length; j++) {
        
        const end = Math.ceil(chunkArray[j].file.size / CHUNK_SIZE);  // 计算分片数量
        const file = chunkArray[j].file;
        let newchunkArray:Array<{ start: number, end: number, index: number, hash: string, blob: Blob, name: string }> = [];

        for (let i = 0; i < end; i++) { // 遍历分片
            const chunk = await createChunk(file, i, CHUNK_SIZE); // 创建分片
            newchunkArray.push(chunk); // 将分片存储到结果数组中
        }
        result.push(newchunkArray); // 将分片存储到结果数组中
    }
    
    postMessage(result); // 向主线程发送结果
}









