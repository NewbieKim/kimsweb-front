'use client';
import { useDevice } from '@/hooks/useDevice';
import { ReactNode } from 'react';

interface PageWrapperProps {
    children: ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
    const { isMobile } = useDevice();

    return (
        <div className={`min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-blue-50 ${isMobile ? 'pb-[80px]' : ''}`}>
            {children}
        </div>
    );
}

