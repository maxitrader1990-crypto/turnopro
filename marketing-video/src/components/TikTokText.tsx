
import React from 'react';
import { interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

export const TikTokText: React.FC<{
    text: string;
    style?: React.CSSProperties;
    delay?: number;
    color?: string;
    strokeColor?: string;
    fontSize?: number;
}> = ({
    text,
    style,
    delay = 0,
    color = 'white',
    strokeColor = 'black',
    fontSize = 90
}) => {
        const frame = useCurrentFrame();
        const { fps } = useVideoConfig();

        // Pop animation
        const scale = spring({
            frame: frame - delay,
            fps,
            config: {
                damping: 12,
                stiffness: 200,
            }
        });

        const opacity = interpolate(frame - delay, [0, 5], [0, 1], { extrapolateRight: 'clamp' });

        return (
            <div style={{
                fontFamily: 'Montserrat, Impact, sans-serif',
                fontWeight: 900,
                fontSize,
                color,
                textAlign: 'center',
                textTransform: 'uppercase',
                // Heavy stroke approach
                WebkitTextStroke: `4px ${strokeColor}`,
                textShadow: `6px 6px 0px rgba(0,0,0,0.8)`, // Sharp hard shadow
                transform: `scale(${scale})`,
                opacity,
                position: 'absolute',
                width: '100%',
                lineHeight: 1.1,
                zIndex: 100,
                ...style
            }}>
                {text}
            </div>
        );
    };
