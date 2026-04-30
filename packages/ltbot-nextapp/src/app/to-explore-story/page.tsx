import { prisma } from "@/lib/prisma";
import StoryCard from "./components/StoryCard";
import StoryListClient from "./components/StoryListClient";
import PageWrapper from "./components/PageWrapper";

export default async function ToExploreStory() {
    // 在服务端直接使用 Prisma 查询故事列表
    const fetchStories = async () => {
        try {
            const stories = await prisma.story.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        }
                    },
                    _count: {
                        select: {
                            likes: true,
                            favorites: true,
                            comments: {
                                where: {
                                    isDeleted: false,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 20, // 先加载20条数据
            });
            return stories;
        } catch (err) {
            console.error('获取故事失败', err);
            return [];
        }
    };
    
    const stories = await fetchStories();

    return (
        <PageWrapper>
            {/* 头部标题 */}
            <div
                className="sticky top-0 z-10 backdrop-blur-md shadow-sm"
                style={{ background: "var(--theme-bg-surface)" }}
            >
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <h1
                        className="text-3xl font-bold bg-clip-text text-transparent"
                        style={{
                            backgroundImage:
                                "linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))",
                        }}
                    >
                        探索故事
                    </h1>
                    <p className="mt-1" style={{ color: "var(--theme-text-muted)" }}>发现精彩的儿童故事</p>
                </div>
            </div>

            {/* 故事列表 - 瀑布流布局 */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {stories.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📚</div>
                        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--theme-text)" }}>暂无故事</h2>
                        <p style={{ color: "var(--theme-text-muted)" }}>快去创建第一个故事吧！</p>
                    </div>
                ) : (
                    <StoryListClient initialStories={stories} />
                )}
            </div>
        </PageWrapper>
    );
}
