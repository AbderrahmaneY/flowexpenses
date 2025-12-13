'use client';

import { useEffect, useState, useRef } from 'react';

// Eggplant Rain Easter Egg
// Trigger: 3 clicks on non-interactive background

interface RainDrop {
    id: number;
    left: number;       // 0-100vw
    delay: number;      // 0-300ms
    duration: number;   // 600-1000ms
    size: number;       // 18-32px
    rotation: number;   // random start rotation
}

export default function EasterEggs() {
    const [drops, setDrops] = useState<RainDrop[]>([]);

    // State refs for event tracking
    const clickCountRef = useRef(0);
    const lastClickTimeRef = useRef(0);
    const lastTriggerTimeRef = useRef(0);

    useEffect(() => {
        const isInteractive = (target: HTMLElement) => {
            // 1. Tag check
            const interactiveTags = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL', 'OPTION'];
            if (interactiveTags.includes(target.tagName)) return true;

            // 2. Attribute check
            if (target.getAttribute('role') === 'button') return true;
            if (target.isContentEditable) return true;

            // 3. Recursive/Closest check for containers
            if (target.closest('button, a, input, [role="button"], [data-no-easter-egg="true"]')) return true;

            return false;
        };

        const handleClick = (e: MouseEvent) => {
            // Filter: Must be non-interactive
            if (isInteractive(e.target as HTMLElement)) return;

            const now = Date.now();

            // Reset sequence if too slow (> 1s since last click)
            if (now - lastClickTimeRef.current > 1000) {
                clickCountRef.current = 0;
            }

            clickCountRef.current++;
            lastClickTimeRef.current = now;

            // Trigger on 3rd click
            if (clickCountRef.current === 3) {
                clickCountRef.current = 0; // Reset

                // Cooldown: 10 seconds
                if (now - lastTriggerTimeRef.current < 10000) return;
                lastTriggerTimeRef.current = now;

                triggerRain();
            }
        };

        const triggerRain = () => {
            const newDrops: RainDrop[] = [];
            const count = 50 + Math.floor(Math.random() * 20); // 50-70 drops

            for (let i = 0; i < count; i++) {
                newDrops.push({
                    id: Date.now() + i,
                    left: Math.random() * 100,
                    delay: Math.random() * 0.3, // 0-300ms delay
                    duration: 1.8 + Math.random() * 1.2, // 1.8-3.0s duration (3x slower)
                    size: 18 + Math.random() * 14, // 18-32px
                    rotation: Math.random() * 360
                });
            }

            setDrops(newDrops);

            // AUTO CLEANUP: Remove strictly after max duration (3.0s + 300ms delay + buffer)
            setTimeout(() => {
                setDrops([]);
            }, 4000);
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    if (drops.length === 0) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 9999,
                overflow: 'hidden'
            }}
        >
            {drops.map(drop => (
                <div
                    key={drop.id}
                    style={{
                        position: 'absolute',
                        left: `${drop.left}vw`,
                        top: '-50px',
                        fontSize: `${drop.size}px`,
                        transform: `rotate(${drop.rotation}deg)`,
                        animation: `eggplant-fall ${drop.duration}s linear forwards`,
                        animationDelay: `${drop.delay}s`
                    }}
                >
                    🍆
                </div>
            ))}
            <style jsx>{`
                @keyframes eggplant-fall {
                    0% {
                        top: -50px;
                        opacity: 1;
                    }
                    100% {
                        top: 110vh;
                        opacity: 0.8;
                        transform: rotate(720deg); /* Spin while falling */
                    }
                }
            `}</style>
        </div>
    );
}
