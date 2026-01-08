'use client';
import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Textarea } from '@heroui/input';
import { useUser } from '@clerk/nextjs';
import { toast } from 'react-toastify';
import Image from 'next/image';

interface Comment {
    id: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string;
        avatar?: string | null;
    };
    replies: Comment[];
    _count?: {
        replies: number;
    };
}

interface StoryCommentSectionProps {
    storyId: number;
    initialCount?: number;
}

export default function StoryCommentSection({ 
    storyId, 
    initialCount = 0 
}: StoryCommentSectionProps) {
    const { isSignedIn, user } = useUser();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [content, setContent] = useState('');
    const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);

    // 加载评论列表
    const loadComments = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/stories/${storyId}/comments`);
            const result = await response.json();
            
            if (result.success) {
                setComments(result.data.comments);
            }
        } catch (error) {
            console.error('加载评论失败:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadComments();
    }, [storyId]);

    // 提交评论
    const handleSubmit = async () => {
        if (!isSignedIn) {
            toast.error('请先登录');
            return;
        }

        if (!content.trim()) {
            toast.error('评论内容不能为空');
            return;
        }

        setSubmitLoading(true);

        try {
            const response = await fetch(`/api/stories/${storyId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: content.trim(),
                    parentId: replyTo?.id,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success('评论成功');
                setContent('');
                setReplyTo(null);
                loadComments(); // 刷新评论列表
            } else {
                toast.error(result.message || '评论失败');
            }
        } catch (error) {
            console.error('评论失败:', error);
            toast.error('评论失败，请重试');
        } finally {
            setSubmitLoading(false);
        }
    };

    // 删除评论
    const handleDelete = async (commentId: number) => {
        if (!confirm('确定要删除这条评论吗？')) {
            return;
        }

        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('删除成功');
                loadComments();
            } else {
                const result = await response.json();
                toast.error(result.message || '删除失败');
            }
        } catch (error) {
            console.error('删除评论失败:', error);
            toast.error('删除失败，请重试');
        }
    };

    // 渲染单个评论
    const renderComment = (comment: Comment, isReply = false) => (
        <div 
            key={comment.id} 
            className={`flex gap-3 ${isReply ? 'ml-12 mt-3' : 'mt-4'}`}
        >
            {/* 用户头像 */}
            <div className="flex-shrink-0">
                {comment.user.avatar ? (
                    <Image
                        src={comment.user.avatar}
                        alt={comment.user.name}
                        width={36}
                        height={36}
                        className="rounded-full"
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
                        {comment.user.name.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            {/* 评论内容 */}
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">
                        {comment.user.name}
                    </span>
                    <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleString('zh-CN')}
                    </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                    {comment.content}
                </p>
                <div className="flex items-center gap-3 text-xs">
                    <button
                        className="text-gray-500 hover:text-purple-600"
                        onClick={() => setReplyTo({ id: comment.id, name: comment.user.name })}
                    >
                        回复
                    </button>
                    {user?.id === comment.user.id && (
                        <button
                            className="text-gray-500 hover:text-red-600"
                            onClick={() => handleDelete(comment.id)}
                        >
                            删除
                        </button>
                    )}
                </div>

                {/* 渲染回复 */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2">
                        {comment.replies.map(reply => renderComment(reply, true))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-bold mb-4">
                评论 ({comments.length})
            </h3>

            {/* 评论输入框 */}
            <div className="mb-6">
                {replyTo && (
                    <div className="mb-2 text-sm text-gray-600">
                        回复 @{replyTo.name}
                        <button
                            className="ml-2 text-red-500"
                            onClick={() => setReplyTo(null)}
                        >
                            取消
                        </button>
                    </div>
                )}
                <Textarea
                    placeholder={isSignedIn ? '写下你的评论...' : '请先登录后评论'}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={!isSignedIn}
                    minRows={3}
                    className="mb-2"
                />
                <Button
                    color="primary"
                    onClick={handleSubmit}
                    isLoading={submitLoading}
                    isDisabled={!isSignedIn || submitLoading}
                >
                    发表评论
                </Button>
            </div>

            {/* 评论列表 */}
            {loading ? (
                <div className="text-center py-8 text-gray-500">
                    加载中...
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    暂无评论，快来发表第一条评论吧！
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map(comment => renderComment(comment))}
                </div>
            )}
        </div>
    );
}

