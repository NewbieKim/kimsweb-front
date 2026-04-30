'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { Button } from '@heroui/button';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useDevice } from '@/hooks/useDevice';
import { useAzureTTS } from '@/hooks/useAzureTTS';
import VoicePickerModal from '@/app/components/VoicePickerModal';
import AudioPlayerBar from '@/app/components/AudioPlayerBar';
import type { VoiceRole } from '@/constants/ttsVoices';
import { toDisplayStoryText } from '@/lib/tts/storyScript';
interface Story {
    id: number;
    ageGroup: string;
    themeType: string;
    classicTheme?: string | null;
    classicSubTheme?: string | null;
    customTheme?: string | null;
    characterSettings: string;
    wordLimit: number;
    content?: string | null;
    coverImage?: string | null;
    extData?: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string;
        avatar?: string | null;
    };
    _count?: {
        likes: number;
        favorites: number;
        comments: number;
    };
}

interface Comment {
    id: number;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        avatar?: string | null;
    };
    replies?: Comment[];
}

interface StoryExtData {
    ttsScript?: string | null;
}

export default function StoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { isSignedIn } = useUser();
    const storyId = params.id as string;
    const { isMobile } = useDevice();
    const azureTTS = useAzureTTS();

    const [story, setStory] = useState<Story | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [favorited, setFavorited] = useState(false);
    const [showCommentInput, setShowCommentInput] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [replyTo, setReplyTo] = useState<Comment | null>(null);
    const [showVoicePicker, setShowVoicePicker] = useState(false);

    const parseStoryExtData = (extDataRaw?: string | null): StoryExtData => {
        if (!extDataRaw) {
            return {};
        }
        try {
            return JSON.parse(extDataRaw) as StoryExtData;
        } catch (error) {
            console.error('解析故事 extData 失败:', error);
            return {};
        }
    };

    // 加载故事详情
    useEffect(() => {
        if (storyId) {
            loadStoryDetail();
            loadComments();
        }
    }, [storyId]);

    // 检查用户互动状态
    useEffect(() => {
        if (isSignedIn && story) {
            checkUserInteraction();
        }
    }, [isSignedIn, story?.id]);

    const loadStoryDetail = async () => {
        try {
            const response = await fetch(`/api/stories/${storyId}`);
            const result = await response.json();

            if (result.success) {
                setStory(result.data);
            } else {
                toast.error('故事不存在');
                router.push('/to-explore-story');
            }
        } catch (error) {
            console.error('加载故事失败:', error);
            toast.error('加载失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async () => {
        try {
            const response = await fetch(`/api/stories/${storyId}/comments`);
            const result = await response.json();

            if (result.success) {
                setComments(result.data.comments);
            }
        } catch (error) {
            console.error('加载评论失败:', error);
        }
    };

    const checkUserInteraction = async () => {
        // TODO: 实现检查用户是否已点赞/收藏
        // 暂时使用简单逻辑
    };

    const handleLike = async () => {
        if (!isSignedIn) {
            toast.error('请先登录');
            return;
        }

        try {
            const method = liked ? 'DELETE' : 'POST';
            const response = await fetch(`/api/stories/${storyId}/like`, { method });
            const result = await response.json();

            if (result.success) {
                setLiked(!liked);
                if (story) {
                    setStory({
                        ...story,
                        _count: {
                            ...story._count!,
                            likes: story._count!.likes + (liked ? -1 : 1),
                        },
                    });
                }
                toast.success(liked ? '已取消点赞' : '点赞成功');
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('点赞失败:', error);
            toast.error('操作失败');
        }
    };

    const handleFavorite = async () => {
        if (!isSignedIn) {
            toast.error('请先登录');
            return;
        }

        try {
            const method = favorited ? 'DELETE' : 'POST';
            const response = await fetch(`/api/stories/${storyId}/favorite`, { method });
            const result = await response.json();

            if (result.success) {
                setFavorited(!favorited);
                if (story) {
                    setStory({
                        ...story,
                        _count: {
                            ...story._count!,
                            favorites: story._count!.favorites + (favorited ? -1 : 1),
                        },
                    });
                }
                toast.success(favorited ? '已取消收藏' : '收藏成功');
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('收藏失败:', error);
            toast.error('操作失败');
        }
    };

    const handleComment = async () => {
        if (!commentText.trim()) {
            toast.error('请输入评论内容');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`/api/stories/${storyId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: commentText,
                    parentId: replyTo?.id,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success('评论成功');
                setCommentText('');
                setShowCommentInput(false);
                setReplyTo(null);
                loadComments();
                if (story) {
                    setStory({
                        ...story,
                        _count: {
                            ...story._count!,
                            comments: story._count!.comments + 1,
                        },
                    });
                }
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('评论失败:', error);
            toast.error('评论失败');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = (comment: Comment) => {
        if (!isSignedIn) {
            toast.error('请先登录');
            return;
        }
        setReplyTo(comment);
        setShowCommentInput(true);
    };

    const handleShare = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: getStoryTitle(story!),
                url: url,
            });
        } else {
            navigator.clipboard.writeText(url);
            toast.success('链接已复制');
        }
    };

    const handleListenFullText = async (role: VoiceRole) => {
        const extData = parseStoryExtData(story?.extData);
        const sourceText = extData.ttsScript?.trim() || story?.content?.trim() || '';

        if (!sourceText) {
            toast.error('故事内容为空，暂时无法朗读');
            return;
        }
        await azureTTS.play(sourceText, role);
    };

    const getStoryTitle = (story: Story) => {
        if (story.classicTheme) {
            return `${story.classicTheme}${story.classicSubTheme ? ' · ' + story.classicSubTheme : ''}`;
        }
        return story.customTheme || '精彩故事';
    };

    const formatContent = (content: string) => {
        const paragraphs = content.split('\n').filter(p => p.trim());
        return paragraphs.map((para, index) => (
            <p key={index} className="mb-4 leading-relaxed text-gray-800 text-[15px]">
                {para}
            </p>
        ));
    };

    const formatTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: zhCN,
            });
        } catch {
            return '刚刚';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!story) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <div className="text-6xl mb-4">😔</div>
                <h2 className="text-xl font-bold mb-2">故事不存在</h2>
                <Button onClick={() => router.push('/to-explore-story')}>
                    返回探索
                </Button>
            </div>
        );
    }

    const displayStoryContent = story.content ? toDisplayStoryText(story.content) : '';

    return (
        <div className={`min-h-screen bg-white ${isMobile ? 'pb-[200px]' : 'pb-20'}`}>
            {/* 顶部导航栏 */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b z-50">
                <div className="flex items-center justify-between px-4 py-3 max-w-[720px] mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={handleShare}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* 主内容区域 */}
            <div>
                {/* 封面图片 */}
                <div className="relative w-full max-h-[50vh] md:max-h-[60vh] bg-gray-100">
                    {story.coverImage ? (
                        <Image
                            src={story.coverImage}
                            alt="封面"
                            width={800}
                            height={600}
                            className="w-full h-auto object-cover"
                        />
                    ) : (
                        <div className="h-80 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                            <span className="text-6xl">📖</span>
                        </div>
                    )}
                </div>

                {/* 用户信息栏 */}
                <div className="flex items-center gap-3 px-4 py-4 border-b">
                    {story.user.avatar ? (
                        <Image
                            src={story.user.avatar}
                            alt={story.user.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                            {story.user.name.charAt(0)}
                        </div>
                    )}
                    <div className="flex-1">
                        <div className="font-medium text-sm">{story.user.name}</div>
                        <div className="text-xs text-gray-500">{formatTime(story.createdAt)}</div>
                    </div>
                    <Button
                        size="sm"
                        variant="bordered"
                        className="rounded-full border-gray-300 text-gray-700"
                    >
                        + 关注
                    </Button>
                </div>

                {/* 故事内容区 */}
                <div className="px-4 py-6 max-w-[720px] mx-auto">
                    {/* 标题 */}
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h1 className="text-xl md:text-2xl font-bold">
                            {getStoryTitle(story)}
                        </h1>
                        <button
                            type="button"
                            className="flex-shrink-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-sm font-semibold text-white shadow hover:opacity-95"
                            onClick={() => setShowVoicePicker(true)}
                        >
                            听全文
                        </button>
                    </div>

                    {/* 正文 */}
                    <div className="prose prose-sm max-w-none">
                        {displayStoryContent ? formatContent(displayStoryContent) : (
                            <p className="text-gray-500 italic">故事内容生成中...</p>
                        )}
                    </div>

                    {/* 标签 */}
                    <div className="flex flex-wrap gap-2 mt-6">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                            #{story.ageGroup}
                        </span>
                        {story.classicTheme && (
                            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                                #{story.classicTheme}
                            </span>
                        )}
                        {story.customTheme && (
                            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                                #{story.customTheme}
                            </span>
                        )}
                    </div>

                    {/* 互动数据 */}
                    <div className="flex gap-6 mt-6 py-4 border-t border-b text-sm text-gray-600">
                        <div>
                            <span className="font-semibold text-gray-900">{story._count?.likes || 0}</span> 点赞
                        </div>
                        <div>
                            <span className="font-semibold text-gray-900">{story._count?.favorites || 0}</span> 收藏
                        </div>
                        <div>
                            <span className="font-semibold text-gray-900">{story._count?.comments || 0}</span> 评论
                        </div>
                    </div>
                </div>

                {/* 评论区 */}
                <div className="px-4 py-6 max-w-[720px] mx-auto pb-[60px] sm:pb-6">
                    <h3 className="text-lg font-bold mb-4">
                        评论 {story._count?.comments || 0}
                    </h3>

                    {comments.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <div className="text-4xl mb-2">💬</div>
                            <p className="text-sm">暂无评论，快来发表第一条评论吧</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    onReply={handleReply}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 底部互动栏 */}
            {/* 移动端需要往上移动 60px，避免被 BottomNav 遮挡 */}
            <div className={`fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 ${isMobile ? 'pb-[60px]' : ''}`}>
                <div className="flex items-center gap-3 px-4 py-3 max-w-[720px] mx-auto">
                    <button
                        onClick={() => setShowCommentInput(true)}
                        className="flex-1 h-10 px-4 bg-gray-100 rounded-full text-left text-sm text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                        说点什么...
                    </button>

                    <button
                        onClick={handleLike}
                        className="flex flex-col items-center gap-1 min-w-[48px]"
                    >
                        <span className="text-2xl">{liked ? '❤️' : '🤍'}</span>
                        <span className="text-xs text-gray-600">{story._count?.likes || 0}</span>
                    </button>

                    <button
                        onClick={handleFavorite}
                        className="flex flex-col items-center gap-1 min-w-[48px]"
                    >
                        <span className="text-2xl">{favorited ? '⭐' : '☆'}</span>
                        <span className="text-xs text-gray-600">{story._count?.favorites || 0}</span>
                    </button>

                    <button
                        onClick={handleShare}
                        className="flex flex-col items-center gap-1 min-w-[48px]"
                    >
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span className="text-xs text-gray-600">分享</span>
                    </button>
                </div>
            </div>

            {/* 评论输入弹窗 */}
            {showCommentInput && (
                // 如果是小屏幕，评论输入弹窗需要往上移动60px，避免被底部互动栏遮挡，pc端不移动但是需要展示
                <div className={`fixed inset-0 bg-black/50 z-50 md:top-auto md:bottom-auto ${true ? 'top-[60px]' : ''}`} onClick={() => setShowCommentInput(false)}>
                    <div
                        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-w-[720px] mx-auto`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`p-4 ${isMobile ? 'pb-[80px]' : ''}`}>
                            {replyTo && (
                                <div className="mb-2 text-sm text-gray-600">
                                    回复 @{replyTo.user.name}
                                    <button
                                        onClick={() => setReplyTo(null)}
                                        className="ml-2 text-red-500"
                                    >
                                        取消
                                    </button>
                                </div>
                            )}
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="写下你的评论..."
                                className="w-full h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-3">
                                <Button
                                    variant="bordered"
                                    onClick={() => {
                                        setShowCommentInput(false);
                                        setReplyTo(null);
                                        setCommentText('');
                                    }}
                                >
                                    取消
                                </Button>
                                <Button
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                    onClick={handleComment}
                                    isLoading={submitting}
                                    isDisabled={submitting}
                                >
                                    发表
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <VoicePickerModal
                isOpen={showVoicePicker}
                onClose={() => setShowVoicePicker(false)}
                onSelectRole={handleListenFullText}
            />

            <AudioPlayerBar
                status={azureTTS.status}
                progress={azureTTS.progress}
                roleName={azureTTS.currentRole?.name}
                roleEmoji={azureTTS.currentRole?.emoji}
                isMobile={isMobile}
                onPause={azureTTS.pause}
                onResume={azureTTS.resume}
                onStop={azureTTS.stop}
            />
        </div>
    );
}

// 评论项组件
interface CommentItemProps {
    comment: Comment;
    onReply: (comment: Comment) => void;
}

function CommentItem({ comment, onReply }: CommentItemProps) {
    const formatTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: zhCN,
            });
        } catch {
            return '刚刚';
        }
    };

    return (
        <div className="flex gap-3">
            {comment.user.avatar ? (
                <div className="h-[36px] w-[36px]">
                    <Image
                        src={comment.user.avatar}
                        alt={comment.user.name}
                        width={36}
                        height={36} // 最高优先级，现在被父级覆盖如何解决？
                        className="rounded-full flex-shrink-0"
                    />
                </div>
            ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {comment.user.name.charAt(0)}
                </div>
            )}

            <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{comment.user.name}</div>
                <div className="text-gray-800 mt-1 text-[15px] break-words">{comment.content}</div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{formatTime(comment.createdAt)}</span>
                    <button
                        onClick={() => onReply(comment)}
                        className="hover:text-purple-600 transition-colors"
                    >
                        回复
                    </button>
                </div>

                {/* 回复列表 */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-3">
                        {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-2">
                                {reply.user.avatar ? (
                                    <div className="h-[28px] w-[28px]">
                                        <Image
                                            src={reply.user.avatar}
                                            alt={reply.user.name}
                                            width={28}
                                            height={28}
                                            className="rounded-full flex-shrink-0"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {reply.user.name.charAt(0)}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{reply.user.name}</div>
                                    <div className="text-gray-800 text-sm break-words">{reply.content}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {formatTime(reply.createdAt)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
