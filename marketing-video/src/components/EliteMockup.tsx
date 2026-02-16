import React from 'react';
import { Img, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

export const EliteMockup: React.FC<{
    src: string;
    delay?: number;
    scale?: number;
    rotate3D?: boolean;
}> = ({ src, delay = 0, scale = 1.35, rotate3D = true }) => {
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

    // 3D rotation effect - ELITE
    const rotateY = rotate3D ? interpolate(
        Math.sin((frame - delay) * 0.02),
        [-1, 1],
        [-3, 3]
    ) : 0;

    const rotateX = rotate3D ? interpolate(
        Math.cos((frame - delay) * 0.03),
        [-1, 1],
        [-1.5, 1.5]
    ) : 0;

    // Breathing glow animation
    const glowIntensity = interpolate(
        Math.sin((frame - delay) * 0.06),
        [-1, 1],
        [0.12, 0.18]
    );

    return (
        <div style={{
            position: 'relative',
            width: 320 * scale,
            height: 650 * scale,
            opacity,
            transform: `
                translateY(${translateY + floatY}px) 
                scale(${animationScale})
            `,
            perspective: '1200px',
        }}>
            {/* Enhanced glow effect - ELITE */}
            <div style={{
                position: 'absolute',
                inset: -30,
                background: `radial-gradient(circle, rgba(201,165,90,${glowIntensity}), transparent 70%)`,
                filter: 'blur(40px)',
                zIndex: 0,
            }} />

            {/* Main mockup container with 3D */}
            <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: 35,
                overflow: 'hidden',
                border: '4px solid rgba(201, 165, 90, 0.3)',
                boxShadow: `
                    0 0 50px rgba(201, 165, 90, 0.25),
                    0 30px 80px rgba(0, 0, 0, 0.9),
                    0 15px 35px rgba(0, 0, 0, 0.7),
                    0 5px 15px rgba(0, 0, 0, 0.5),
                    inset 0 2px 4px rgba(255, 255, 255, 0.08)
                `,
                background: 'linear-gradient(145deg, rgba(35,35,38,0.85), rgba(18,18,20,0.95))',
                transform: `
                    perspective(1200px)
                    rotateY(${rotateY}deg)
                    rotateX(${rotateX}deg)
                `,
                transformStyle: 'preserve-3d',
                zIndex: 1,
            }}>
                {/* Image with proper fit - LARGER and CLEARER */}
                <Img
                    src={src}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'center',
                        filter: 'brightness(1.08) contrast(1.12) saturate(1.08)',
                    }}
                />

                {/* Premium screen reflection overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `
                        linear-gradient(
                            135deg, 
                            rgba(255,255,255,0.05) 0%, 
                            transparent 40%, 
                            rgba(255,255,255,0.03) 100%
                        )
                    `,
                    pointerEvents: 'none',
                }} />

                {/* Edge lighting - ELITE */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, rgba(201,165,90,0.4), transparent)',
                }} />
            </div>

            {/* Enhanced floor reflection/shadow */}
            <div style={{
                position: 'absolute',
                bottom: -30,
                left: '8%',
                right: '8%',
                height: 25,
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.5), transparent)',
                filter: 'blur(20px)',
                zIndex: -1,
            }} />

            {/* Ambient occlusion shadows - DEPTH */}
            <div style={{
                position: 'absolute',
                inset: -10,
                background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)',
                zIndex: -2,
            }} />
        </div>
    );
};
