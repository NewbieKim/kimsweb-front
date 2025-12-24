// 故事详情页
// 'use client'

import { GetStoryById } from '@/server/storyServer';
export default async function StoryDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const story = await GetStoryById(parseInt(id));
    console.log('story', story);
    return <div>
        <h1>{story.themeType}</h1>
        <p>{JSON.parse(story.characterSettings).description}</p>
    </div>;
}