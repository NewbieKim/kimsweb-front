'use client';
import React, { useEffect, useState } from "react";

import { Button } from "@heroui/button";
import CustomLoader from "@/app/components/CustomLoader";

import { getAllStories } from "@/server/storyServer";
import { http } from "@/lib/request";

export default function ToExploreStory() {
    const [stories, setStories] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    useEffect(() => {
        getStories();
        // getAllStories(0).then((res) => {
        //     setStories(res);
        // });
    }, []);

    const getStories = async () => {
        const res = await http.get("http://ltbot.top/api/agencies");
        console.log(res);
    }
    return (
        <div>
            <h1>探索故事</h1>
            {stories.map((story) => (
                <div key={story.id}>
                    <h2>{story.title}</h2>
                    <p>{story.content}</p>
                </div>
            ))}
        </div>
    );
}
