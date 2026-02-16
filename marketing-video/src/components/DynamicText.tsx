import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const DynamicText: React.FC<{
    text: string;
    color?: string;
    fontSize?: number;
    delay?: number;
}> = ({ text, color = '#FFD700', fontSize = 80, delay = 0 }) => {
    const frame = useCurrentFrame();
    const opacity = interpolate(frame - delay, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
    const translateY = interpolate(frame - delay, [0, 20], [50, 0], { extrapolateRight: 'clamp' });

    return (
        <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize,
            fontWeight: 900,
            color: color,
            textAlign: 'center',
            opacity,
            transform: `translateY(${translateY}px)`,
            textShadow: '0 0 20px rgba(0,0,0,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '5px'
        }}>
            {text}
        </div>
    );
};
