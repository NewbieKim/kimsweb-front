// import { Button } from "@heroui/button";
// import CustomLoader from "@/app/components/CustomLoader";

// import { getAllStories } from "@/server/storyServer";
import { http } from "@/lib/request";
// import { prisma } from "@/lib/prisma";

export default async function ToExploreStory() {

    const getStories = async (): Promise<any> => {
        const res = await http.get("http://ltbot.top/api/agencies");
        console.log('res', res);
        return res.data || [];
    }
    
    // 在服务端组件中直接使用 Prisma 查询，不通过 API
    // const fetchUsers = async () => {
    //     try {
    //         const users = await prisma.user.findMany({
    //             include: {
    //                 posts: true
    //             }
    //         });
    //         console.log('users', users);
    //         return users;
    //     } catch (err) {
    //         console.error('获取用户失败', err);
    //         return [];
    //     }
    // };
    
    const stories = await getStories() as any;
    // const users = await fetchUsers();
    return (
        <div>
            <h1>探索故事</h1>
            {stories.map((story: any) => (   
                <div key={story.entityId}>
                    <h2>{story.title}</h2>
                    <p>{story.description}</p>
                </div>
            ))}
        </div>
    );
}
