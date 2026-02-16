import React from 'react';
import { Img, interpolate, useCurrentFrame } from 'remotion';

export const PhoneMockup: React.FC<{
    src: string;
    style?: React.CSSProperties;
}> = ({ src, style }) => {
    return (
        <div style={{
            width: 500,
            height: 1000,
            backgroundColor: '#000',
            borderRadius: 50,
            border: '10px solid #333',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            ...style
        }}>
            {/* Notch */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 150,
                height: 30,
                backgroundColor: '#000',
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
                zIndex: 10
            }} />

            {/* Screen Content */}
            <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
    );
};
