import React from 'react';
import { Img, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

export const PremiumPhoneMockup: React.FC<{
    src: string;
    delay?: number;
}> = ({ src, delay = 0 }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Smooth entrance with spring
    const scale = spring({
        frame: frame - delay,
        fps,
        config: {
            damping: 80,
            stiffness: 150,
        },
    });

    const opacity = interpolate(frame - delay, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

    // Subtle floating animation
    const float = interpolate(
        Math.sin((frame - delay) * 0.05),
        [-1, 1],
        [-5, 5]
    );

    return (
        <div style={{
            width: 450,
            height: 900,
            backgroundColor: '#111',
            borderRadius: 50,
            border: '8px solid #222',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: `
                0 30px 60px rgba(255, 215, 0, 0.2),
                0 10px 30px rgba(0,0,0,0.8),
                inset 0 0 0 2px rgba(255, 215, 0, 0.1)
            `,
            opacity,
            transform: `scale(${scale}) translateY(${float}px)`,
        }}>
            {/* Notch */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 140,
                height: 28,
                backgroundColor: '#000',
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
                zIndex: 10
            }} />

            {/* Screen Content with glow */}
            <div style={{
                width: '100%',
                height: '100%',
                position: 'relative',
            }}>
                <Img src={src} style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'brightness(1.1) contrast(1.05)',
                }} />
                {/* Screen glow overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `
                        radial-gradient(circle at 50% 30%, rgba(255,215,0,0.1) 0%, transparent 50%)
                    `,
                    pointerEvents: 'none'
                }} />
            </div>
        </div>
    );
};
