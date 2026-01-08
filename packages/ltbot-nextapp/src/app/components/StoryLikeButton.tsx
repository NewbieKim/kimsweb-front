'use client';
import { useState } from 'react';
import { Button } from '@heroui/button';
import { useUser } from '@clerk/nextjs';
import { toast } from 'react-toastify';

interface StoryLikeButtonProps {
    storyId: number;
    initialLiked?: boolean;
    initialCount?: number;
}

export default function StoryLikeButton({ 
    storyId, 
    initialLiked = false, 
    initialCount = 0 
}: StoryLikeButtonProps) {
    const { isSignedIn } = useUser();
    const [liked, setLiked] = useState(initialLiked);
    const [count, setCount] = useState(initialCount);
    const [loading, setLoading] = useState(false);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation(); // 防止触发父元素的点击事件

        if (!isSignedIn) {
            toast.error('请先登录');
            return;
        }

        setLoading(true);

        try {
            if (liked) {
                // 取消点赞
                const response = await fetch(`/api/stories/${storyId}/like`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    setLiked(false);
                    setCount(count - 1);
                    toast.success('已取消点赞');
                } else {
                    const result = await response.json();
                    toast.error(result.message || '取消点赞失败');
                }
            } else {
                // 点赞
                const response = await fetch(`/api/stories/${storyId}/like`, {
                    method: 'POST',
                });

                if (response.ok) {
                    setLiked(true);
                    setCount(count + 1);
                    toast.success('点赞成功');
                } else {
                    const result = await response.json();
                    toast.error(result.message || '点赞失败');
                }
            }
        } catch (error) {
            console.error('点赞操作失败:', error);
            toast.error('操作失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            size="sm"
            variant={liked ? 'solid' : 'bordered'}
            color={liked ? 'primary' : 'default'}
            onClick={handleLike}
            isLoading={loading}
            isDisabled={loading}
            className="min-w-16"
        >
            <span className="text-base">{liked ? '👍' : '👍🏻'}</span>
            <span className="ml-1">{count}</span>
        </Button>
    );
}

