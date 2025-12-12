'use client';
import { useState } from 'react';

const toggleMenu = () => {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

export default function CreateStory() {
    return (
        <div>
            <button className="btn-primary-custom">按钮</button>
        </div>
    );
}