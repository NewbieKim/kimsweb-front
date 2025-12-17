import { prisma } from "@/lib/prisma";
export const getAllStories = async (offset: number) => {
    // 开发模式：返回模拟故事列表
    // if (isDevMode) {
    //     console.log('开发模式：获取所有模拟故事');
    //     return devModeStories.slice(offset, offset + 8);
    // }
    
    const result: any = await prisma.story.findMany({
        orderBy: {
            id: 'desc'
        },
        limit: 8,
        offset: offset
    });
    return result
}