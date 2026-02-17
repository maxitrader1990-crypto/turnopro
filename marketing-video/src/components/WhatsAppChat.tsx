
import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Message {
    id: number;
    text: string;
    isSender: boolean; // true = me (green), false = them (gray/white)
    startFrame: number;
}

export const WhatsAppChat: React.FC<{
    messages: Message[];
}> = ({ messages }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    return (
        <AbsoluteFill style={{ backgroundColor: '#ECE5DD', padding: 40, fontFamily: 'Helvetica, Arial, sans-serif' }}>
            {/* Header Simulation */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 120,
                background: '#075E54', display: 'flex', alignItems: 'center', paddingLeft: 40, color: 'white',
                zIndex: 10
            }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#ccc', marginRight: 20 }}></div>
                <div>
                    <div style={{ fontSize: 35, fontWeight: 'bold' }}>Cliente Molesto</div>
                    <div style={{ fontSize: 25, opacity: 0.8 }}>en línea</div>
                </div>
            </div>

            <div style={{ marginTop: 140, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {messages.map((msg) => {
                    const delay = msg.startFrame;

                    // Spring animation for pop-in
                    const spr = spring({
                        frame: frame - delay,
                        fps,
                        config: { damping: 12 }
                    });

                    const scale = interpolate(spr, [0, 1], [0, 1]);
                    const opacity = interpolate(spr, [0, 1], [0, 1]);

                    if (frame < delay) return null;

                    return (
                        <div key={msg.id} style={{
                            alignSelf: msg.isSender ? 'flex-end' : 'flex-start',
                            background: msg.isSender ? '#DCF8C6' : 'white',
                            color: 'black',
                            padding: '20px 35px',
                            borderRadius: 20,
                            borderTopLeftRadius: msg.isSender ? 20 : 0,
                            borderTopRightRadius: msg.isSender ? 0 : 20,
                            maxWidth: '80%',
                            fontSize: 40,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            transform: `scale(${scale})`,
                            opacity: opacity,
                            transformOrigin: msg.isSender ? 'top right' : 'top left'
                        }}>
                            {msg.text}
                            <div style={{ fontSize: 20, color: '#999', textAlign: 'right', marginTop: 10 }}>
                                10:2{msg.id} PM {msg.isSender && '✓✓'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </AbsoluteFill>
    );
};
