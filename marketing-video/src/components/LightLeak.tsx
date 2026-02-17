
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';

export const LightLeak: React.FC = () => {
    const frame = useCurrentFrame();
    const { width } = useVideoConfig();

    // Move a big gradient across the screen
    const rawPos = interpolate(frame, [0, 60], [-width, width * 2]);
    const opacity = interpolate(frame, [0, 15, 45, 60], [0, 0.6, 0.6, 0]);

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            <div style={{
                position: 'absolute',
                left: rawPos,
                top: 0,
                width: width,
                height: '100%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 150, 50, 0.5) 50%, transparent 100%)',
                mixBlendMode: 'screen',
                opacity,
                transform: 'skewX(-20deg)',
                filter: 'blur(50px)'
            }} />
        </AbsoluteFill>
    );
};
