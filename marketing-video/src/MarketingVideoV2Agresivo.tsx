import React from 'react';
import { AbsoluteFill, Sequence, Img, useVideoConfig, staticFile, Video, Audio, interpolate, useCurrentFrame } from 'remotion';
import { TikTokText } from './components/TikTokText';
import { CameraShake } from './components/CameraShake';

// Load assets (using staticFile for public folder access)
// We'll skip music for now or use a placeholder if available.
// Assuming images are in public/

export const MarketingVideoV2Agresivo: React.FC = () => {
    const { fps } = useVideoConfig();

    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            {/* Audio - Placeholder, commented out to avoid error if missing */}
            {/* <Audio src={musicTrack} volume={0.5} /> */}

            {/* SCENE 1: VIRAL CLIP (0s - 2.5s) */}
            <Sequence from={0} durationInFrames={2.5 * fps}>
                <CameraShake intensity={5}>
                    <AbsoluteFill>
                        <Video
                            src={staticFile('video_barber_viral.mp4')}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                filter: 'brightness(0.6) contrast(1.2)'
                            }}
                            muted
                            startFrom={0}
                        />
                    </AbsoluteFill>
                    <TikTokText
                        text="BARBEROS..."
                        fontSize={120}
                        style={{ top: '30%' }}
                    />
                </CameraShake>
            </Sequence>

            {/* SCENE 2: GANCHO BRUTAL (2.5s - 6s) */}
            <Sequence from={2.5 * fps} durationInFrames={3.5 * fps}>
                <Sequence from={0} durationInFrames={1.5 * fps}>
                    <Video
                        src={staticFile('video_bored_client.mp4')}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1)' }}
                        muted
                    />
                    <TikTokText
                        text="SI NO TENÉS AGENDA"
                        fontSize={80}
                        style={{ top: '20%' }}
                        color="#FF4444"
                    />
                    <TikTokText
                        text="ONLINE EN 2026..."
                        fontSize={80}
                        style={{ top: '35%' }}
                        delay={10}
                    />
                </Sequence>
                <Sequence from={1.5 * fps} durationInFrames={2 * fps}>
                    <Video
                        src={staticFile('video_busy_shop.mp4')}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.5)' }}
                        muted
                    />
                    <TikTokText
                        text="ESTÁS MUERTO."
                        fontSize={130}
                        style={{ top: '40%' }}
                        color="red"
                        strokeColor="white"
                    />
                </Sequence>
            </Sequence>

            {/* SCENE 3: REALIDAD INCÓMODA (6s - 12s) - WhatsApp Explosion */}
            <Sequence from={6 * fps} durationInFrames={6 * fps}>
                <AbsoluteFill style={{ background: '#111' }}>
                    {/* For WhatsApp, we keep text or need a specific video overlay. 
                         The previous implementation used text only. Let's keep it simple or find a "glitch" video?
                         We didn't download a glitch video. We'll use the 'bored_client' video again but very zoomed in or blurred?
                         No, let's keep the black background with popping text as it's effective for "messages".
                     */}
                    <TikTokText text="TE PREGUNTAN TURNO..." fontSize={70} style={{ top: '20%' }} />
                    <TikTokText text="NO RESPONDÉS..." fontSize={70} style={{ top: '40%' }} delay={30} />
                    <TikTokText text="SE VAN CON OTRO." fontSize={70} style={{ top: '60%' }} delay={60} color="#FF4444" />
                </AbsoluteFill>
            </Sequence>

            {/* SCENE 4: DOLOR ECONÓMICO (12s - 18s) - Empty Chair */}
            <Sequence from={12 * fps} durationInFrames={6 * fps}>
                <Video
                    src={staticFile('video_empty_chair.mp4')}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }}
                    muted
                />
                <TikTokText text="CADA CANCELACIÓN..." fontSize={70} style={{ top: '30%' }} />
                <TikTokText text="ES PLATA QUE NO VUELVE 💸" fontSize={70} style={{ top: '45%' }} delay={40} color="#00FF00" />
            </Sequence>

            {/* SCENE 5: SOLUCIÓN (18s - 30s) - Mockups */}
            <Sequence from={18 * fps} durationInFrames={12 * fps}>
                <AbsoluteFill style={{ background: 'linear-gradient(to bottom, #111, #222)' }}>
                    <Img
                        src={staticFile('booking-mockup.png')}
                        style={{
                            width: '80%',
                            height: 'auto',
                            position: 'absolute',
                            left: '10%',
                            top: '20%',
                            boxShadow: '0 0 40px rgba(0,255,0,0.2)'
                        }}
                    />
                    <TikTokText text="AGENDA AUTOMÁTICA" fontSize={70} style={{ top: '10%' }} />
                    <TikTokText text="CONFIRMA SOLO" fontSize={60} style={{ bottom: '20%' }} delay={30} />
                    <TikTokText text="RECORDATORIOS" fontSize={60} style={{ bottom: '10%' }} delay={60} />
                </AbsoluteFill>
            </Sequence>

            {/* SCENE 6: BENEFICIOS (30s - 38s) - Happy Shop */}
            <Sequence from={30 * fps} durationInFrames={8 * fps}>
                <Video
                    src={staticFile('video_busy_shop.mp4')}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    muted
                    startFrom={90} // Start a bit later in the clip to vary from Scene 2
                />
                <TikTokText text="MENOS MENSAJES" fontSize={60} style={{ top: '20%' }} />
                <TikTokText text="MENOS CANCELACIONES" fontSize={60} style={{ top: '35%' }} delay={30} />
                <TikTokText text="MÁS CLIENTES" fontSize={80} style={{ top: '55%' }} delay={60} color="#FFD700" />
            </Sequence>

            {/* SCENE 7: CTA (38s - 45s) */}
            <Sequence from={38 * fps} durationInFrames={7 * fps}>
                <AbsoluteFill style={{ background: 'black' }}>
                    <TikTokText text="MANDAME:" fontSize={60} style={{ top: '25%' }} />
                    <TikTokText text="BARBER" fontSize={150} style={{ top: '35%' }} color="#FFD700" />
                    <TikTokText text="Y TE LO INSTALO" fontSize={50} style={{ bottom: '20%' }} />
                </AbsoluteFill>
            </Sequence>

            {/* OVERLAY: Esto es para barberías */}
            <AbsoluteFill style={{ pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute',
                    top: 20,
                    width: '100%',
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 24,
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                }}>
                    Esto es para barberías
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
