import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, random } from 'remotion';
import { EliteText } from './EliteText';

export const CinematicText: React.FC<{
    text: string;
    color?: string;
    fontSize?: number;
    delay?: number;
    variant?: 'header' | 'body' | 'accent';
    fontWeight?: number;
    glowColor?: string;
}> = (props) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const { delay = 0 } = props;

    const activeFrame = frame - delay;

    // Glitch effect probability based on time (intense at start, then settles)
    const isGlitchy = activeFrame >= 0 && activeFrame < 15;

    // Random glitch offsets
    const glitchX = isGlitchy ? (random(frame) - 0.5) * 20 : 0;
    const glitchY = isGlitchy ? (random(frame + 1) - 0.5) * 5 : 0;
    const opacityGlitch = isGlitchy ? random(frame + 2) > 0.3 ? 1 : 0 : 1;
    const skewGlitch = isGlitchy ? (random(frame + 3) - 0.5) * 10 : 0;

    // RGB Split/Aberration during glitch
    const rgbSplit = isGlitchy ? 5 : 0;

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Red Channel (Ghost) */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                opacity: isGlitchy ? 0.7 : 0,
                transform: `translate(${glitchX + rgbSplit}px, ${glitchY}px)`,
                color: 'red',
                mixBlendMode: 'screen',
                zIndex: 0
            }}>
                <EliteText {...props} />
            </div>

            {/* Blue Channel (Ghost) */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                opacity: isGlitchy ? 0.7 : 0,
                transform: `translate(${glitchX - rgbSplit}px, ${glitchY}px)`,
                color: 'cyan',
                mixBlendMode: 'screen',
                zIndex: 0
            }}>
                <EliteText {...props} />
            </div>

            {/* Main Text */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                opacity: opacityGlitch,
                transform: `translate(${glitchX}px, ${glitchY}px) skewX(${skewGlitch}deg)`
            }}>
                <EliteText {...props} />
            </div>

            {/* Scanline Cut (White slice) */}
            {isGlitchy && random(frame + 4) > 0.8 && (
                <div style={{
                    position: 'absolute',
                    top: `${random(frame + 5) * 100}%`,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'white',
                    opacity: 0.8,
                    zIndex: 2
                }} />
            )}
        </div>
    );
};
