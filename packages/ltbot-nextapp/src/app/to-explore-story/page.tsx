// import { Button } from "@heroui/button";
// import CustomLoader from "@/app/components/CustomLoader";

// import { getAllStories } from "@/server/storyServer";
import { http } from "@/lib/request";
import { prisma } from "@/lib/prisma";
import { User } from "@/types/response";
export default async function ToExploreStory() {

    const getStories = async (): Promise<any> => {
        const res = await http.get("http://ltbot.top/api/agencies");
        return res.data || [];
    }
    
    // 在服务端组件中直接使用 Prisma 查询，不通过 API
    const fetchUsers = async () => {
        try {
            const users = await prisma.user.findMany({
                include: {
                    posts: true
                }
            });
            return users;
        } catch (err) {
            console.error('获取用户失败', err);
            return [];
        }
    };
    
    // const stories = await getStories() as any;
    const users = await fetchUsers() as any;
    return (
        <div>
            <h1>探索故事</h1>
                {users.map((user: User) => (   
                    <div key={user.id}>
                        <h2>{user.name}</h2>
                        <p>{user.email}</p>
                    </div>
                ))}
        </div>
    );
}
