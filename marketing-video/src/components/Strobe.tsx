
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const Strobe: React.FC<{
    frequency?: number; // Frames between flashes
}> = ({ frequency = 4 }) => {
    const frame = useCurrentFrame();
    const active = frame % frequency === 0;

    if (!active) return null;

    return (
        <AbsoluteFill style={{
            backgroundColor: 'white',
            opacity: 0.15,
            mixBlendMode: 'overlay',
            pointerEvents: 'none'
        }} />
    );
};
