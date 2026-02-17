
import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export const AnimatedText: React.FC<{
    text: string;
    style?: React.CSSProperties;
    startFrame?: number;
    animationType?: 'pop' | 'slide' | 'fade';
    color?: string;
    fontSize?: number;
    strokeColor?: string;
}> = ({
    text,
    style,
    startFrame = 0,
    animationType = 'pop',
    color = 'white',
    fontSize = 80,
    strokeColor = 'black'
}) => {
        const frame = useCurrentFrame();
        const { fps } = useVideoConfig();

        const spr = spring({
            frame: frame - startFrame,
            fps,
            config: { damping: 12 }
        });

        let transform = {};
        let opacity = 1;

        if (animationType === 'pop') {
            const scale = interpolate(spr, [0, 1], [0, 1]);
            transform = { transform: `scale(${scale})` };
        } else if (animationType === 'slide') {
            const y = interpolate(spr, [0, 1], [100, 0]);
            transform = { transform: `translateY(${y}px)` };
            opacity = interpolate(spr, [0, 1], [0, 1]);
        } else {
            opacity = interpolate(spr, [0, 1], [0, 1]);
        }

        if (frame < startFrame) return null;

        return (
            <div style={{
                position: 'absolute',
                width: '100%',
                textAlign: 'center',
                fontWeight: 900,
                fontFamily: 'Montserrat, sans-serif',
                fontSize,
                color,
                textShadow: `3px 3px 0 ${strokeColor}, -1px -1px 0 ${strokeColor}, 1px -1px 0 ${strokeColor}, -1px 1px 0 ${strokeColor}, 1px 1px 0 ${strokeColor}`,
                opacity,
                ...transform,
                ...style
            }}>
                {text}
            </div>
        );
    };
