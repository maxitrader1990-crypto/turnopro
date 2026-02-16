import { AbsoluteFill, Sequence, Img, staticFile } from 'remotion';
import React from 'react';
import { EliteText } from './components/EliteText';
import { EliteMockup } from './components/EliteMockup';
import { SceneTransition } from './components/SceneTransition';
import { ParticleOverlay } from './components/ParticleOverlay';
import { KenBurnsBackground } from './components/KenBurnsBackground';
import { CinematicOverlay } from './components/CinematicOverlay';
import { CinematicText } from './components/CinematicText';
import { WarpTransition } from './components/WarpTransition';
import { CameraShake } from './components/CameraShake';

// 60s horizontal @ 30fps = 1800 frames total
export const MarketingVideoHorizontal: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            {/* Scene 1: Hook Dramático (0-5s / 150 frames) */}
            <Sequence from={0} durationInFrames={150}>
                <WarpTransition direction="in">
                    <SceneTransition durationInFrames={150}>
                        <AbsoluteFill>
                            <KenBurnsBackground
                                src={staticFile("modern_urban_barber_shop.jpg")}
                                opacity={0.35}
                                zoom={1.12}
                                direction="in"
                            />
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to right, rgba(0,0,0,0.9), rgba(0,0,0,0.7))',
                                zIndex: 0
                            }} />
                            <div style={{
                                position: 'relative',
                                zIndex: 1,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                                paddingLeft: '100px'
                            }}>
                                <ParticleOverlay count={10} color="#FF4444" />
                                <CameraShake startDelay={10} duration={15} intensity={15}>
                                    <EliteText
                                        text="¿TU BARBERÍA PIERDE GUITA?"
                                        color="white"
                                        fontSize={95}
                                        delay={10}
                                        fontWeight={900}
                                        variant="header"
                                    />
                                </CameraShake>
                            </div>
                        </AbsoluteFill>
                    </SceneTransition>
                </WarpTransition>
            </Sequence>

            {/* Scene 2: Solución + Dashboard (5-15s / 300 frames) - SIDE BY SIDE */}
            <Sequence from={150} durationInFrames={300}>
                <WarpTransition direction="in">
                    <SceneTransition durationInFrames={300}>
                        <AbsoluteFill style={{ backgroundColor: '#000' }}>
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'row',
                                gap: 60
                            }}>
                                {/* Texto a la izquierda */}
                                <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    paddingLeft: '80px',
                                    gap: 40
                                }}>
                                    <ParticleOverlay count={12} />
                                    <CameraShake startDelay={5} duration={10} intensity={10}>
                                        <EliteText
                                            text="BASTA DE CAOS"
                                            color="white"
                                            fontSize={75}
                                            delay={0}
                                            variant="header"
                                        />
                                    </CameraShake>
                                    <EliteText
                                        text="AUTOMATIZÁ TODO"
                                        color="linear-gradient(135deg, #C9A55A, #D4AF37)"
                                        fontSize={90}
                                        glowColor="#C9A55A"
                                        delay={20}
                                        fontWeight={900}
                                        variant="header"
                                    />
                                    <div style={{ marginTop: 30 }}>
                                        <EliteText
                                            text="✓ Reservas 24/7"
                                            color="#90EE90"
                                            fontSize={50}
                                            delay={40}
                                            variant="body"
                                        />
                                        <EliteText
                                            text="✓ Base de clientes"
                                            color="#90EE90"
                                            fontSize={50}
                                            delay={50}
                                            variant="body"
                                        />
                                        <EliteText
                                            text="✓ Control total"
                                            color="#90EE90"
                                            fontSize={50}
                                            delay={60}
                                            variant="body"
                                        />
                                    </div>
                                </div>

                                {/* Dashboard a la derecha */}
                                <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingRight: '60px'
                                }}>
                                    <div style={{
                                        width: '90%',
                                        height: '80%',
                                        position: 'relative',
                                        boxShadow: '0 30px 80px rgba(255, 215, 0, 0.3)',
                                        borderRadius: 20,
                                        overflow: 'hidden',
                                        border: '2px solid rgba(255, 215, 0, 0.3)'
                                    }}>
                                        <Img
                                            src={staticFile("dashboard-mockup.png")}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                filter: 'brightness(1.1) contrast(1.05)'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </AbsoluteFill>
                    </SceneTransition>
                </WarpTransition>
            </Sequence>

            {/* Scene 3: Mobile App + Booking (15-25s / 300 frames) - REVERSE SIDE BY SIDE */}
            <Sequence from={450} durationInFrames={300}>
                <SceneTransition durationInFrames={300}>
                    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'row-reverse',
                            gap: 80
                        }}>
                            {/* Texto a la derecha */}
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                paddingRight: '80px',
                                gap: 35
                            }}>
                                <ParticleOverlay count={10} />
                                <EliteText
                                    text="RESERVÁ EN"
                                    color="white"
                                    fontSize={70}
                                    delay={0}
                                    variant="header"
                                />
                                <EliteText
                                    text="10 SEGUNDOS"
                                    color="linear-gradient(135deg, #C9A55A, #D4AF37)"
                                    fontSize={85}
                                    glowColor="#C9A55A"
                                    delay={20}
                                    fontWeight={900}
                                    variant="accent"
                                />
                                <EliteText
                                    text="📱 App intuitiva"
                                    color="#90EE90"
                                    fontSize={50}
                                    delay={40}
                                    variant="body"
                                />
                            </div>

                            {/* Mockup a la izquierda */}
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingLeft: '80px'
                            }}>
                                <EliteMockup
                                    src={staticFile("booking-mockup.png")}
                                    delay={30}
                                    scale={1.35}
                                    rotate3D={true}
                                />
                            </div>
                        </div>
                    </AbsoluteFill>
                </SceneTransition>
            </Sequence>

            {/* Scene 4: Beneficios (25-35s / 300 frames) */}
            <Sequence from={750} durationInFrames={300}>
                <SceneTransition durationInFrames={300}>
                    <AbsoluteFill>
                        <KenBurnsBackground
                            src={staticFile("gold_barber_tools.jpg")}
                            opacity={0.25}
                            zoom={1.15}
                            direction="out"
                        />
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'radial-gradient(circle at center, rgba(255,215,0,0.15), transparent 80%)',
                            zIndex: 0
                        }} />
                        <div style={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            gap: 45
                        }}>
                            <ParticleOverlay count={18} />
                            <EliteText
                                text="MÁS CLIENTES. MÁS GUITA."
                                color="linear-gradient(135deg, #C9A55A, #D4AF37)"
                                fontSize={75}
                                glowColor="#C9A55A"
                                delay={0}
                                fontWeight={900}
                                variant="header"
                            />
                            <EliteText
                                text="MENOS ESTRÉS."
                                color="white"
                                fontSize={80}
                                delay={30}
                                variant="header"
                            />
                            <div style={{ marginTop: 40, display: 'flex', gap: 80 }}>
                                <EliteText
                                    text="✓ Simple"
                                    color="#90EE90"
                                    fontSize={55}
                                    delay={50}
                                    variant="body"
                                />
                                <EliteText
                                    text="✓ Rápido"
                                    color="#90EE90"
                                    fontSize={55}
                                    delay={60}
                                    variant="body"
                                />
                                <EliteText
                                    text="✓ Potente"
                                    color="#90EE90"
                                    fontSize={55}
                                    delay={70}
                                    variant="body"
                                />
                            </div>
                        </div>
                    </AbsoluteFill>
                </SceneTransition>
            </Sequence>

            {/* Scene 5: CTA Final (35-60s / 750 frames) */}
            <Sequence from={1050} durationInFrames={750}>
                <SceneTransition durationInFrames={750}>
                    <AbsoluteFill style={{ backgroundColor: 'black' }}>
                        <KenBurnsBackground
                            src={staticFile("modern_urban_barber_shop.jpg")}
                            opacity={0.35}
                            zoom={1.18}
                            direction="in"
                        />
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'radial-gradient(ellipse at center, transparent 20%, #000 90%)',
                            zIndex: 0
                        }} />
                        <div style={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            gap: 50
                        }}>
                            <ParticleOverlay count={25} />
                            <CinematicText
                                text="SUMATE A LA ÉLITE"
                                color="white"
                                fontSize={95}
                                delay={0}
                                fontWeight={900}
                                variant="accent"
                            />
                            <EliteText
                                text="PRUÉBALO GRATIS"
                                color="linear-gradient(135deg, #C9A55A, #D4AF37, #B8941C)"
                                fontSize={110}
                                glowColor="#C9A55A"
                                delay={30}
                                fontWeight={900}
                                variant="header"
                            />
                            <div style={{
                                marginTop: 50,
                                padding: '20px 60px',
                                borderRadius: 15,
                                border: '3px solid #C9A55A',
                                background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(201,165,90,0.08))',
                                boxShadow: '0 0 50px rgba(201, 165, 90, 0.5)',
                            }}>
                                <EliteText
                                    text="www.patagoniaautomatiza.com"
                                    color="white"
                                    fontSize={48}
                                    delay={60}
                                    variant="body"
                                />
                            </div>
                        </div>
                    </AbsoluteFill>
                </SceneTransition>
            </Sequence>
            <CinematicOverlay />
        </AbsoluteFill >
    );
};
