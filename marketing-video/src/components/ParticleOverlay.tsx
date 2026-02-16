import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, random } from 'remotion';

export const ParticleOverlay: React.FC<{
    count?: number;
    color?: string;
}> = ({ count = 15, color = '#FFD700' }) => {
    const frame = useCurrentFrame();

    return (
        <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 10 }}>
            {Array.from({ length: count }).map((_, i) => {
                // Use seed for consistent randomness
                const seed = i * 1000;
                const startX = random(`x-${seed}`) * 100;
                const startY = random(`y-${seed}`) * 100;
                const speed = random(`speed-${seed}`) * 0.5 + 0.3;
                const size = random(`size-${seed}`) * 4 + 2;
                const delay = random(`delay-${seed}`) * 60;

                // Floating animation
                const y = interpolate(
                    frame - delay,
                    [0, 200],
                    [startY, startY - 30],
                    { extrapolateRight: 'wrap' }
                );

                const x = startX + Math.sin((frame - delay) * 0.02) * 3;

                // Opacity pulsing
                const opacity = interpolate(
                    Math.sin((frame - delay + i * 10) * 0.05),
                    [-1, 1],
                    [0.03, 0.12]
                );

                return (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: `${x}%`,
                            top: `${y}%`,
                            width: size,
                            height: size,
                            borderRadius: '50%',
                            background: color,
                            opacity,
                            boxShadow: `0 0 ${size * 2}px ${color}`,
                            filter: 'blur(1px)',
                        }}
                    />
                );
            })}
        </AbsoluteFill>
    );
};
