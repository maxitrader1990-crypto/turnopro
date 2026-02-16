import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const SceneTransition: React.FC<{
    children: React.ReactNode;
    durationInFrames: number;
    fadeInDuration?: number;
    fadeOutDuration?: number;
}> = ({ children, durationInFrames, fadeInDuration = 15, fadeOutDuration = 15 }) => {
    const frame = useCurrentFrame();

    const opacity = interpolate(
        frame,
        [0, fadeInDuration, durationInFrames - fadeOutDuration, durationInFrames],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const scale = interpolate(
        frame,
        [0, fadeInDuration],
        [0.95, 1],
        { extrapolateRight: 'clamp' }
    );

    return (
        <AbsoluteFill style={{
            opacity,
            transform: `scale(${scale})`,
        }}>
            {children}
        </AbsoluteFill>
    );
};
