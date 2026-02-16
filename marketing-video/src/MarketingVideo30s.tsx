import { AbsoluteFill, Sequence, Img, staticFile } from 'remotion';
import React from 'react';
import { EliteText } from './components/EliteText';
import { EliteMockup } from './components/EliteMockup';
import { SceneTransition } from './components/SceneTransition';
import { ParticleOverlay } from './components/ParticleOverlay';
import { KenBurnsBackground } from './components/KenBurnsBackground';
import { CinematicOverlay } from './components/CinematicOverlay';
import { CinematicText } from './components/CinematicText';

// 30s video @ 30fps = 900 frames total
export const MarketingVideo30s: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            {/* Scene 1: Hook - Problema (0-5s / 150 frames) */}
            <Sequence from={0} durationInFrames={150}>
                <SceneTransition durationInFrames={150}>
                    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <KenBurnsBackground
                            src={staticFile("chaos_appointment_book.jpg")}
                            opacity={0.35}
                            zoom={1.12}
                            direction="in"
                        />

                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.6))',
                            zIndex: 0
                        }} />

                        <ParticleOverlay count={12} color="#FF4444" />
                        <div style={{
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 30,
                            alignItems: 'center'
                        }}>
                            <div style={{ fontSize: 100, marginBottom: 20 }}>🛑</div>
                            <EliteText
                                text="¿TU BARBERÍA"
                                color="white"
                                fontSize={85}
                                delay={10}
                                variant="header"
                            />
                            <EliteText
                                text="PIERDE GUITA?"
                                color="#FF4444"
                                fontSize={95}
                                glowColor="#FF0000"
                                delay={30}
                                fontWeight={900}
                                variant="header"
                            />
                        </div>
                    </AbsoluteFill>
                </SceneTransition>
            </Sequence>

            {/* Scene 2: Solución con Mockup (5-12s / 210 frames) - SPLIT LAYOUT */}
            <Sequence from={150} durationInFrames={210}>
                <SceneTransition durationInFrames={210}>
                    <AbsoluteFill style={{ backgroundColor: '#000' }}>
                        {/* Layout vertical - texto arriba, mockup abajo */}
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '50px 30px'
                        }}>
                            <ParticleOverlay count={10} />
                            {/* Texto en la parte superior */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 20,
                                marginTop: 30
                            }}>
                                <EliteText
                                    text="AUTOMATIZÁ"
                                    color="white"
                                    fontSize={85}
                                    delay={0}
                                    variant="header"
                                />
                                <EliteText
                                    text="TU BARBERÍA"
                                    color="linear-gradient(135deg, #C9A55A, #D4AF37)"
                                    fontSize={90}
                                    glowColor="#C9A55A"
                                    delay={15}
                                    fontWeight={900}
                                    variant="header"
                                />
                                <EliteText
                                    text="🚀 Al toque"
                                    color="#90EE90"
                                    fontSize={55}
                                    delay={30}
                                    glowColor="#00FF00"
                                    variant="body"
                                />
                            </div>

                            {/* Mockup ELITE - 40% MÁS GRANDE */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'flex-end',
                                marginBottom: 0
                            }}>
                                <EliteMockup
                                    src={staticFile("booking-mockup.png")}
                                    delay={45}
                                    scale={1.35}
                                    rotate3D={true}
                                />
                            </div>
                        </div>
                    </AbsoluteFill>
                </SceneTransition>
            </Sequence>

            {/* Scene 3: Beneficios (12-18s / 180 frames) */}
            <Sequence from={360} durationInFrames={180}>
                <SceneTransition durationInFrames={180}>
                    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <KenBurnsBackground
                            src={staticFile("gold_barber_tools.jpg")}
                            opacity={0.25}
                            zoom={1.15}
                            direction="out"
                        />

                        {/* Golden gradient overlay */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'radial-gradient(circle at center, rgba(255,215,0,0.2), transparent 70%)',
                            zIndex: 0
                        }} />

                        <ParticleOverlay count={15} />
                        <div style={{
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 35,
                            alignItems: 'center'
                        }}>
                            <EliteText
                                text="24/7"
                                color="linear-gradient(135deg, #C9A55A, #D4AF37)"
                                fontSize={140}
                                glowColor="#C9A55A"
                                delay={0}
                                fontWeight={900}
                                variant="accent"
                            />
                            <EliteText
                                text="RESERVAS AUTOMÁTICAS"
                                color="white"
                                fontSize={70}
                                delay={20}
                                variant="header"
                            />
                            <div style={{
                                marginTop: 20,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 15
                            }}>
                                <EliteText
                                    text="✓ Sin vueltas"
                                    color="#90EE90"
                                    fontSize={50}
                                    delay={40}
                                    glowColor="#00FF00"
                                    variant="body"
                                />
                                <EliteText
                                    text="✓ Más clientes"
                                    color="#90EE90"
                                    fontSize={50}
                                    delay={50}
                                    glowColor="#00FF00"
                                    variant="body"
                                />
                                <EliteText
                                    text="✓ Menos bondi"
                                    color="#90EE90"
                                    fontSize={50}
                                    delay={60}
                                    glowColor="#00FF00"
                                    variant="body"
                                />
                            </div>
                        </div>
                    </AbsoluteFill>
                </SceneTransition>
            </Sequence>

            {/* Scene 4: CTA Final (18-30s / 360 frames) */}
            <Sequence from={540} durationInFrames={360}>
                <SceneTransition durationInFrames={360}>
                    <AbsoluteFill style={{ backgroundColor: 'black' }}>
                        <KenBurnsBackground
                            src={staticFile("modern_urban_barber_shop.jpg")}
                            opacity={0.4}
                            zoom={1.18}
                            direction="in"
                        />

                        {/* Radial dark overlay */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'radial-gradient(circle at center, transparent 30%, #000 85%)',
                            zIndex: 0
                        }} />

                        <ParticleOverlay count={20} />
                        <div style={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            gap: 40
                        }}>
                            <CinematicText
                                text="PROBALO"
                                color="white"
                                fontSize={100}
                                delay={0}
                                fontWeight={900}
                                variant="header"
                            />
                            <EliteText
                                text="GRATIS"
                                color="linear-gradient(135deg, #C9A55A, #D4AF37, #E8C547)"
                                fontSize={110}
                                glowColor="#C9A55A"
                                delay={20}
                                fontWeight={900}
                                variant="header"
                            />

                            <div style={{
                                marginTop: 60,
                                padding: '18px 45px',
                                borderRadius: 12,
                                border: '3px solid #C9A55A',
                                background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(201,165,90,0.12))',
                                boxShadow: '0 0 40px rgba(201, 165, 90, 0.4), inset 0 0 25px rgba(201, 165, 90, 0.08)',
                            }}>
                                <EliteText
                                    text="www.patagoniaautomatiza.com"
                                    color="white"
                                    fontSize={42}
                                    delay={50}
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
