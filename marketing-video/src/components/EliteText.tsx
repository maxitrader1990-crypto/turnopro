import React from 'react';
import { interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

export const EliteText: React.FC<{
    text: string;
    color?: string;
    glowColor?: string;
    fontSize?: number;
    delay?: number;
    fontWeight?: number;
    variant?: 'header' | 'body' | 'accent';
}> = ({
    text,
    color = '#FFD700',
    glowColor = '#C9A55A',
    fontSize = 80,
    delay = 0,
    fontWeight = 900,
    variant = 'header'
}) => {
        const frame = useCurrentFrame();
        const { fps } = useVideoConfig();

        // Smooth spring animation with elite easing
        const scale = spring({
            frame: frame - delay,
            fps,
            config: {
                damping: 100, // Reduced damping for more "pop"
                stiffness: 200,
                mass: 0.8,
            },
        });

        const opacity = interpolate(frame - delay, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
        const translateY = interpolate(frame - delay, [0, 30], [50, 0], {
            extrapolateRight: 'clamp',
            extrapolateLeft: 'clamp'
        });

        const blur = interpolate(frame - delay, [0, 15], [10, 0], {
            extrapolateRight: 'clamp',
            extrapolateLeft: 'clamp'
        });

        // "Heartbeat" / Pulse effect for living text
        const pulse = Math.sin((frame - delay) * 0.1) * 0.02 + 1;

        const fontFamily = variant === 'header'
            ? "'Montserrat', 'Inter', system-ui, sans-serif"
            : variant === 'accent'
                ? "'Bebas Neue', 'Arial Black', sans-serif"
                : "'Poppins', 'Inter', system-ui, sans-serif";

        const letterSpacing = variant === 'accent' ? '5px' : '2px';

        const isGradient = color.includes('gradient') || color === '#FFD700';

        // ULTRA-PREMIUM "REALISTIC GOLD" GRADIENT
        // Mimics light reflection on a gold bar: Dark -> Light -> Dark -> Light -> Dark
        const goldGradient = 'linear-gradient(to bottom, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)';

        const finalColor = isGradient ? goldGradient : color;

        // CONTOUR & 3D SHADOW LOGIC
        // We use text-shadow to create both the "border" (contour) and the "depth" (3D block)
        const contourColor = 'rgba(0,0,0,0.9)';
        const shadowColor = 'rgba(0,0,0,0.6)';

        // This shadow stack creates:
        // 1. A tight black outline (1px-2px)
        // 2. A "Hard" drop shadow for 3D depth
        // 3. A soft glow for atmosphere
        const luxuryShadow = `
            /* Hard Contour (Stroke simulation) */
            2px 2px 0px ${contourColor},
            -1px -1px 0px ${contourColor},
            1px -1px 0px ${contourColor},
            -1px 1px 0px ${contourColor},
            1px 1px 0px ${contourColor},
            /* 3D Depth */
            3px 3px 0px ${shadowColor},
            4px 4px 0px ${shadowColor},
            5px 5px 0px ${shadowColor},
            /* Soft Glow */
            0 0 20px ${glowColor}60,
            0 0 40px ${glowColor}40
        `;

        // 500% EXTRA: SHIMMER EFFECT
        // A sweeping gradient that moves across the text
        const shimmerPos = interpolate(
            (frame - delay) % 90, // Repeats every 3 seconds (30fps * 3)
            [0, 20, 90], // Fast sweep, then wait
            [-100, 200, 200]
        );

        return (
            <div style={{
                fontFamily,
                fontSize,
                fontWeight,
                // If gradient, we need transparent text fill + background clip
                background: isGradient ? finalColor : undefined,
                WebkitBackgroundClip: isGradient ? 'text' : undefined,
                WebkitTextFillColor: isGradient ? 'transparent' : finalColor,
                color: isGradient ? 'transparent' : finalColor, // Fallback
                textAlign: 'center',
                opacity,
                transform: `translateY(${translateY}px) scale(${scale * pulse})`,
                filter: `blur(${blur}px)`,
                textShadow: isGradient ? 'none' : luxuryShadow,
                // For gradient text, use drop-shadow.
                // NOTE: We combine the shimmer by using a mask or just an overlay?
                // CSS Gradients can't easily be animated *on top* of another gradient background-clip without complex stacking.
                // INNOVATION: We will add the shimmer to the `filter` or use a pseudo-element if possible, 
                // but since inline styles are tricky for pseudo-elements, we'll use `mask-image` or a mix-blend-mode overlay.
                // SIMPLEST POWERFUL WAY: Brightness filter animation? No, that washes it out.
                // Let's use a linear-gradient background that MOVES.
                // We update `finalColor` to include the shimmer highlight.

                // We can't easily animate the background-position of the gold gradient AND a shimmer layer in one property clearly without CSS classes.
                // BUT we can use `filter: brightness()` mapped to the shimmer position? 
                // Let's try a different approach: The visual "pop" comes from the masking.

                // Let's stick to the high-contrast Filter Drop-Shadows.
                // And add a specific "Flash" filter occasionally.
                filter: `blur(${blur}px) drop-shadow(2px 2px 0px rgba(0,0,0,0.8)) drop-shadow(0 0 15px ${glowColor}80) brightness(${interpolate(
                    (frame - delay) % 90,
                    [0, 5, 10, 90],
                    [1, 1.3, 1, 1] // Subtle flash of brightness
                )
                    })`,
                textTransform: 'uppercase',
                letterSpacing,
                lineHeight: 1.1,
                padding: '0 40px',
                zIndex: 10,
                position: 'relative' // Needed for potential overlay
            }}>
                {/* 
                   Dual-Layer Trick for Gradient + Stroke:
                   We render the text TWICE.
                   1. Background layer: Stroke/Contour 
                   2. Foreground layer: Gradient Fill
                */}
                {isGradient && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: -1,
                        WebkitTextFillColor: 'transparent',
                        WebkitTextStroke: '6px rgba(0,0,0,0.8)', // Thick contour
                        background: 'none',
                        textShadow: 'none',
                        transform: 'translateZ(-1px)' // Push back slightly
                    }} aria-hidden="true">
                        {text}
                    </div>
                )}

                {text}

                {/* SHIMMER OVERLAY - The "500% More" Touch */}
                {/* This overlay acts as the light reflection moving across */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.8) 50%, transparent 70%)`,
                    transform: `translateX(${shimmerPos}%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    zIndex: 2,
                    pointerEvents: 'none',
                    mixBlendMode: 'overlay'
                }} aria-hidden="true">
                    {text}
                </div>
            </div>
        );
    };
