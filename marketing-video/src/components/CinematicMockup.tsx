import React from 'react';
import { Img, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

export const CinematicMockup: React.FC<{
    src: string;
    delay?: number;
    scale?: number;
}> = ({ src, delay = 0, scale = 1 }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Smooth spring entrance animation
    const animationScale = spring({
        frame: frame - delay,
        fps,
        config: {
            damping: 100,
            stiffness: 150,
            mass: 0.8,
        },
    });

    const opacity = interpolate(frame - delay, [0, 25], [0, 1], { extrapolateRight: 'clamp' });
    const translateY = interpolate(frame - delay, [0, 35], [50, 0], {
        extrapolateRight: 'clamp',
        extrapolateLeft: 'clamp'
    });

    // Subtle floating animation
    const floatY = interpolate(
        Math.sin((frame - delay) * 0.05),
        [-1, 1],
        [-5, 5]
    );

    return (
        <div style={{
            position: 'relative',
            width: 320 * scale,
            height: 650 * scale,
            opacity,
            transform: `translateY(${translateY + floatY}px) scale(${animationScale})`,
        }}>
            {/* Glow effect behind mockup */}
            <div style={{
                position: 'absolute',
                inset: -20,
                background: 'radial-gradient(circle, rgba(255,215,0,0.15), transparent 70%)',
                filter: 'blur(30px)',
                zIndex: 0,
            }} />

            {/* Main mockup container */}
            <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: 35,
                overflow: 'hidden',
                border: '3px solid rgba(255, 215, 0, 0.25)',
                boxShadow: `
                    0 0 40px rgba(255, 215, 0, 0.2),
                    0 25px 60px rgba(0, 0, 0, 0.8),
                    0 10px 25px rgba(0, 0, 0, 0.6),
                    inset 0 1px 2px rgba(255, 255, 255, 0.05)
                `,
                background: 'linear-gradient(145deg, rgba(30,30,30,0.8), rgba(15,15,15,0.9))',
                zIndex: 1,
            }}>
                {/* Image with proper fit - NO CROP */}
                <Img
                    src={src}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain', // Changed from 'cover' to 'contain' to show full image
                        objectPosition: 'center',
                        filter: 'brightness(1.05) contrast(1.1) saturate(1.05)',
                    }}
                />

                {/* Subtle screen reflection overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)',
                    pointerEvents: 'none',
                }} />
            </div>

            {/* Bottom reflection/shadow for depth */}
            <div style={{
                position: 'absolute',
                bottom: -25,
                left: '10%',
                right: '10%',
                height: 20,
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.4), transparent)',
                filter: 'blur(15px)',
                zIndex: -1,
            }} />
        </div>
    );
};
