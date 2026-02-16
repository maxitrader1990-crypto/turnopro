import React from 'react';
import { interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

export const PremiumText: React.FC<{
    text: string;
    color?: string;
    glowColor?: string;
    fontSize?: number;
    delay?: number;
    fontWeight?: number;
}> = ({ text, color = '#FFD700', glowColor = '#FFD700', fontSize = 80, delay = 0, fontWeight = 900 }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Smooth spring animation
    const scale = spring({
        frame: frame - delay,
        fps,
        config: {
            damping: 100,
            stiffness: 200,
            mass: 0.5,
        },
    });

    const opacity = interpolate(frame - delay, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
    const translateY = interpolate(frame - delay, [0, 25], [30, 0], {
        extrapolateRight: 'clamp',
        extrapolateLeft: 'clamp'
    });

    // Pulsing glow effect
    const glowIntensity = interpolate(
        Math.sin((frame - delay) * 0.1),
        [-1, 1],
        [20, 40]
    );

    return (
        <div style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize,
            fontWeight,
            color,
            textAlign: 'center',
            opacity,
            transform: `translateY(${translateY}px) scale(${scale})`,
            textShadow: `
                0 0 ${glowIntensity}px ${glowColor},
                0 0 ${glowIntensity * 2}px ${glowColor},
                0 4px 20px rgba(0,0,0,0.8),
                0 2px 4px rgba(0,0,0,0.5)
            `,
            textTransform: 'uppercase',
            letterSpacing: '3px',
            lineHeight: 1.2,
            padding: '0 40px',
            background: color.includes('gradient') ? color : undefined,
            WebkitBackgroundClip: color.includes('gradient') ? 'text' : undefined,
            WebkitTextFillColor: color.includes('gradient') ? 'transparent' : undefined,
        }}>
            {text}
        </div>
    );
};
