'use client';

import {
    motion,
    MotionValue,
    useMotionValue,
    useSpring,
    useTransform,
    type SpringOptions,
    AnimatePresence,
    useScroll,
    useVelocity
} from 'framer-motion';
import React, { Children, cloneElement, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';

export type DockItemData = {
    icon: React.ReactNode;
    label: React.ReactNode;
    onClick: () => void;
    className?: string;
};

export type DockProps = {
    items: DockItemData[];
    className?: string;
    distance?: number;
    panelHeight?: number;
    baseItemSize?: number;
    dockHeight?: number;
    magnification?: number;
    spring?: SpringOptions;
};

type DockItemProps = {
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
    mouseX: MotionValue<number>;
    spring: SpringOptions;
    distance: number;
    baseItemSize: number;
    magnification: number;
    isMobile: boolean;
};

function DockItem({
    children,
    className = '',
    onClick,
    mouseX,
    spring,
    distance,
    magnification,
    baseItemSize,
    isMobile
}: DockItemProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isHovered = useMotionValue(0);
    const [rect, setRect] = useState({ x: 0, width: baseItemSize });

    // Optimization: Use a ResizeObserver for more efficient rect tracking
    useLayoutEffect(() => {
        if (!ref.current || isMobile) return;

        const updateRect = () => {
            if (ref.current) {
                const domRect = ref.current.getBoundingClientRect();
                setRect({ x: domRect.x, width: domRect.width });
            }
        };

        const observer = new ResizeObserver(updateRect);
        observer.observe(ref.current);

        // Also update on scroll/resize for global position
        window.addEventListener('resize', updateRect, { passive: true });
        window.addEventListener('scroll', updateRect, { passive: true });

        updateRect();

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect);
        };
    }, [isMobile]);

    const mouseDistance = useTransform(mouseX, val => {
        if (isMobile) return Infinity;
        return val - rect.x - rect.width / 2;
    });

    const targetSize = useTransform(
        mouseDistance,
        [-distance, 0, distance],
        [baseItemSize, magnification, baseItemSize]
    );

    const size = useSpring(targetSize, spring);

    return (
        <motion.div
            ref={ref}
            style={{
                width: isMobile ? baseItemSize : size,
                height: isMobile ? baseItemSize : size,
                touchAction: 'manipulation',
                willChange: isMobile ? 'auto' : 'width, height' // GPU hint
            }}
            onHoverStart={() => !isMobile && isHovered.set(1)}
            onHoverEnd={() => !isMobile && isHovered.set(0)}
            onFocus={() => !isMobile && isHovered.set(1)}
            onBlur={() => !isMobile && isHovered.set(0)}
            onClick={onClick}
            className={`relative inline-flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border-orange-500/30 border shadow-2xl ${className} cursor-pointer transition-colors active:scale-90`}
            tabIndex={0}
            role="button"
            aria-haspopup="true"
        >
            {Children.map(children, child =>
                React.isValidElement(child)
                    ? cloneElement(child as React.ReactElement<{ isHovered?: MotionValue<number> }>, { isHovered })
                    : child
            )}
        </motion.div>
    );
}

function DockLabel({ children, className = '', isHovered }: { children: React.ReactNode; className?: string; isHovered?: MotionValue<number> }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!isHovered) return;
        const unsubscribe = isHovered.on('change', (latest: number) => {
            setIsVisible(latest === 1);
        });
        return () => unsubscribe();
    }, [isHovered]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 0 }}
                    animate={{ opacity: 1, scale: 1, y: -25 }}
                    exit={{ opacity: 0, scale: 0.8, y: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`${className} absolute -top-10 left-1/2 w-fit whitespace-pre rounded-md border border-orange-500/40 bg-black/90 px-3 py-1 font-bold tracking-widest uppercase text-amber-200 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50`}
                    role="tooltip"
                    style={{ x: '-50%', fontSize: '9px' }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function DockIcon({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`flex items-center justify-center text-orange-200 ${className}`}>{children}</div>;
}

export default function Dock({
    items,
    className = '',
    spring = { mass: 0.1, stiffness: 250, damping: 18 }, // Snappier spring
    magnification = 72,
    distance = 140,
    panelHeight = 64,
    dockHeight = 110,
    baseItemSize = 48
}: DockProps) {
    const mouseX = useMotionValue(Infinity);
    const isDockHovered = useMotionValue(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile, { passive: true });
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const maxHeight = useMemo(() => (isMobile ? panelHeight : Math.max(dockHeight, magnification + 32)), [magnification, isMobile, panelHeight, dockHeight]);
    const heightRow = useTransform(isDockHovered, [0, 1], [panelHeight, maxHeight]);
    const height = useSpring(heightRow, spring);

    return (
        <motion.div
            style={{
                height: isMobile ? panelHeight + 24 : height, // Increased hover area
                scrollbarWidth: 'none'
            }}
            className="fixed bottom-0 left-0 right-0 z-[100] flex justify-center pointer-events-none pb-6 md:pb-10 px-2 md:px-4"
        >
            <motion.div
                onMouseMove={(e) => {
                    if (isMobile) return;
                    isDockHovered.set(1);
                    mouseX.set(e.pageX);
                }}
                onMouseLeave={() => {
                    if (isMobile) return;
                    isDockHovered.set(0);
                    mouseX.set(Infinity);
                }}
                className={`${className} flex items-center md:items-end w-full md:w-max max-w-full gap-3 md:gap-5 rounded-3xl md:rounded-[2rem] border-orange-500/20 border-2 bg-black/40 backdrop-blur-2xl pointer-events-auto shadow-[0_-15px_60px_rgba(0,0,0,0.7)] px-4 md:px-8 py-2.5 overflow-x-auto md:overflow-visible`}
                style={{
                    height: panelHeight,
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none' // IE/Edge
                }}
                role="toolbar"
                aria-label="Application dock"
            >
                {/* CSS to hide scrollbar for webkit */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .overflow-x-auto::-webkit-scrollbar { display: none; }
                `}} />

                {items.map((item, index) => (
                    <div key={index} className="flex-shrink-0">
                        <DockItem
                            onClick={item.onClick}
                            className={item.className}
                            mouseX={mouseX}
                            spring={spring}
                            distance={distance}
                            magnification={magnification}
                            baseItemSize={isMobile ? 42 : baseItemSize}
                            isMobile={isMobile}
                        >
                            <DockIcon>{item.icon}</DockIcon>
                            <DockLabel>{item.label}</DockLabel>
                        </DockItem>
                    </div>
                ))}
            </motion.div>
        </motion.div>
    );
}
