'use client';
import { useState } from 'react';
import { Button } from '@heroui/button';
import { useUser } from '@clerk/nextjs';
import { toast } from 'react-toastify';

interface StoryFavoriteButtonProps {
    storyId: number;
    initialFavorited?: boolean;
    initialCount?: number;
}

export default function StoryFavoriteButton({ 
    storyId, 
    initialFavorited = false, 
    initialCount = 0 
}: StoryFavoriteButtonProps) {
    const { isSignedIn } = useUser();
    const [favorited, setFavorited] = useState(initialFavorited);
    const [count, setCount] = useState(initialCount);
    const [loading, setLoading] = useState(false);

    const handleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation(); // 防止触发父元素的点击事件

        if (!isSignedIn) {
            toast.error('请先登录');
            return;
        }

        setLoading(true);

        try {
            if (favorited) {
                // 取消收藏
                const response = await fetch(`/api/stories/${storyId}/favorite`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    setFavorited(false);
                    setCount(count - 1);
                    toast.success('已取消收藏');
                } else {
                    const result = await response.json();
                    toast.error(result.message || '取消收藏失败');
                }
            } else {
                // 收藏
                const response = await fetch(`/api/stories/${storyId}/favorite`, {
                    method: 'POST',
                });

                if (response.ok) {
                    setFavorited(true);
                    setCount(count + 1);
                    toast.success('收藏成功');
                } else {
                    const result = await response.json();
                    toast.error(result.message || '收藏失败');
                }
            }
        } catch (error) {
            console.error('收藏操作失败:', error);
            toast.error('操作失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            size="sm"
            variant={favorited ? 'solid' : 'bordered'}
            color={favorited ? 'warning' : 'default'}
            onClick={handleFavorite}
            isLoading={loading}
            isDisabled={loading}
            className="min-w-16"
        >
            <span className="text-base">{favorited ? '⭐' : '☆'}</span>
            <span className="ml-1">{count}</span>
        </Button>
    );
}

