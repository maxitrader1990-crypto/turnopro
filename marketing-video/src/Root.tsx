import { Composition } from 'remotion';
import { MarketingVideo30s } from './MarketingVideo30s';
import { MarketingVideo60s } from './MarketingVideo60s';
import { MarketingVideoHorizontal } from './MarketingVideoHorizontal';
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
        </>
    );
};
