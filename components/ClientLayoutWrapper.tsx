'use client';

import React, { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

export default function ClientLayoutWrapper({
    children,
    interVariable,
}: {
    children: React.ReactNode;
    interVariable: string;
}) {
    const [mounted, setMounted] = useState(false);
    const [showChildren, setShowChildren] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <body
            className={`${interVariable} antialiased font-sans flex flex-col min-h-screen text-slate-100 dark`}
            style={{
                backgroundColor: 'transparent',
            }}
        >
            {mounted && <LoadingScreen onComplete={() => setShowChildren(true)} />}

            <div className={`fixed inset-0 z-[-1] bg-[#0a0f1d] transition-opacity duration-1000 ${showChildren ? 'opacity-100' : 'opacity-0'}`} />

            <div className={`relative z-10 w-full min-h-screen transition-opacity duration-1000 ${showChildren ? 'opacity-100' : 'opacity-0'}`}>
                {children}
            </div>
        </body>
    );
}
