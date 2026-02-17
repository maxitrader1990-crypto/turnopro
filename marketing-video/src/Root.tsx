
import { Composition } from 'remotion';
import { MarketingVideo30s } from './MarketingVideo30s';
import { MarketingVideo60s } from './MarketingVideo60s';
import { MarketingVideoHorizontal } from './MarketingVideoHorizontal';
import { MarketingVideoV2Agresivo } from './MarketingVideoV2Agresivo';
import { MarketingVideoV3 } from './MarketingVideoV3';
import { MarketingVideoV4Elite } from './MarketingVideoV4Elite';
import { MarketingVideoV5GodMode } from './MarketingVideoV5GodMode';
import { MarketingVideoV6ThreeD } from './MarketingVideoV6ThreeD';
import { TestVideo } from './TestVideo';
import './style.css';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="TestVideo"
                component={TestVideo}
                durationInFrames={150}
                fps={30}
                width={1080}
                height={1920}
            />
            <Composition
                id="MarketingVideo30s"
                component={MarketingVideo30s}
                durationInFrames={30 * 30}
                fps={30}
                width={1080}
                height={1920}
            />
            <Composition
                id="MarketingVideo60s"
                component={MarketingVideo60s}
                durationInFrames={60 * 30}
                fps={30}
                width={1080}
                height={1920}
            />
            <Composition
                id="MarketingVideoHorizontal"
                component={MarketingVideoHorizontal}
                durationInFrames={60 * 30} // 60s for now
                fps={30}
                width={1920}
                height={1080}
            />
            <Composition
                id="AgresivoV2"
                component={MarketingVideoV2Agresivo}
                durationInFrames={45 * 30}
                fps={30}
                width={1080}
                height={1920}
            />
            <Composition
                id="PeakyV3"
                component={MarketingVideoV3}
                durationInFrames={45 * 30}
                fps={30}
                width={1080}
                height={1920}
            />
            <Composition
                id="EliteV4"
                component={MarketingVideoV4Elite}
                durationInFrames={40 * 30}
                fps={30}
                width={1080}
                height={1920}
            />
            <Composition
                id="GodModeV5"
                component={MarketingVideoV5GodMode}
                durationInFrames={40 * 30}
                fps={30}
                width={1080}
                height={1920}
            />
            <Composition
                id="ThreeDV6"
                component={MarketingVideoV6ThreeD}
                durationInFrames={40 * 30}
                fps={30}
                width={1080}
                height={1920}
            />
        </>
    );
};
