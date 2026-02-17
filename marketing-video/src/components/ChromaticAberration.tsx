
import React from 'react';
import { AbsoluteFill, random } from 'remotion';

export const ChromaticAberration: React.FC<{
    children: React.ReactNode;
    offset?: number; // How far the channels split
}> = ({ children, offset = 5 }) => {
    // If offset is 0, just render children once to save performance
    if (offset === 0) return <>{children}</>;

    return (
        <AbsoluteFill>
            {/* Red Channel */}
            <AbsoluteFill style={{
                transform: `translateX(${-offset}px) translateY(${-offset * 0.5}px)`,
                mixBlendMode: 'screen',
                filter: 'sepia(1) saturate(5) hue-rotate(-50deg)', // Red-ish
                opacity: 0.8
            }}>
                {children}
            </AbsoluteFill>

            {/* Blue/Green Channel */}
            <AbsoluteFill style={{
                transform: `translateX(${offset}px) translateY(${offset * 0.5}px)`,
                mixBlendMode: 'screen',
                filter: 'sepia(1) saturate(5) hue-rotate(180deg)', // Blue-ish
                opacity: 0.8
            }}>
                {children}
            </AbsoluteFill>

            {/* Original/Base (Green-ish to complete RGB or just base) */}
            <AbsoluteFill style={{ mixBlendMode: 'normal' }}>
                {children}
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
