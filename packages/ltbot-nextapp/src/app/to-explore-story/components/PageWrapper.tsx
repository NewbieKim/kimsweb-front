'use client';
import { useDevice } from '@/hooks/useDevice';
import { ReactNode } from 'react';

interface PageWrapperProps {
    children: ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
    const { isMobile } = useDevice();

    return (
        <div
            className={`min-h-screen ${isMobile ? 'pb-[80px]' : ''}`}
            style={{ background: "var(--theme-bg-base)" }}
        >
            {children}
        </div>
    );
}

