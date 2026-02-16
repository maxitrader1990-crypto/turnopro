import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';

export const KenBurnsBackground: React.FC<{
    src: string;
    opacity?: number;
    zoom?: number;
    direction?: 'in' | 'out' | 'left' | 'right';
}> = ({ src, opacity = 0.35, zoom = 1.15, direction = 'in' }) => {
    const frame = useCurrentFrame();

    // Ken Burns zoom effect
    const scale = interpolate(
        frame,
        [0, 300],
        direction === 'out' ? [zoom, 1] : [1, zoom],
        { extrapolateRight: 'clamp' }
    );

    // Pan direction
    const translateX = direction === 'left'
        ? interpolate(frame, [0, 300], [0, -5], { extrapolateRight: 'clamp' })
        : direction === 'right'
            ? interpolate(frame, [0, 300], [0, 5], { extrapolateRight: 'clamp' })
            : 0;

    const translateY = direction === 'in' || direction === 'out'
        ? interpolate(frame, [0, 300], [0, 3], { extrapolateRight: 'clamp' })
        : 0;

    return (
        <AbsoluteFill style={{ opacity, overflow: 'hidden' }}>
            <div style={{
                width: '100%',
                height: '100%',
                transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
            }}>
                <Img
                    src={src}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.9) saturate(1.1) contrast(1.05)',
                    }}
                />
            </div>
        </AbsoluteFill>
    );
};
