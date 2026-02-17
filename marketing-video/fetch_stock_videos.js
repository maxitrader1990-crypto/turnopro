
const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');
const path = require('path');

const searches = [
    { query: 'barber', filename: 'video_barber_viral.mp4' },
    { query: 'smartphone man', filename: 'video_bored_client.mp4' },
    { query: 'barbershop', filename: 'video_busy_shop.mp4' },
    { query: 'chair', filename: 'video_empty_chair.mp4' }
];

const downloadFile = (url, filepath) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`Downloaded ${path.basename(filepath)}`);
                    resolve();
                });
            } else {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
};

const checkUrlExists = (url) => {
    return new Promise((resolve) => {
        const req = https.head(url, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.end();
    });
};

(async () => {
    // Launch browser
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    for (const item of searches) {
        const url = `https://mixkit.co/free-stock-video/${encodeURIComponent(item.query)}/?orientation=vertical`;
        console.log(`Searching: ${url}`);

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 2000)); // Wait for hydration

            // Find first video src
            let videoSrc = await page.evaluate(() => {
                // Mixkit uses <video> tags for previews
                const v = document.querySelector('video');
                return v ? (v.currentSrc || v.src) : null;
            });

            if (videoSrc) {
                // Mixkit preview URLs look like: https://assets.mixkit.co/videos/preview/mixkit-barber-cutting-hair-1234-small.mp4
                // or https://assets.mixkit.co/videos/43232/43232-360.mp4
                // We want to try to get a better quality if possible.
                // Common patterns: -360.mp4, -720.mp4, -1080.mp4, or just .mp4

                console.log(`Found preview: ${videoSrc}`);

                let bestUrl = videoSrc;
                // Try to upgrade
                if (videoSrc.includes('-360.mp4')) {
                    const possible720 = videoSrc.replace('-360.mp4', '-720.mp4');
                    // We can't easily check existence inside puppeteer context efficiently for all, 
                    // but we can try to download the 720p version first.
                    console.log(`Trying upgrade to 720p: ${possible720}`);
                    if (await checkUrlExists(possible720)) {
                        bestUrl = possible720;
                    }
                }

                const dest = path.join(__dirname, 'public', item.filename);
                console.log(`Downloading ${bestUrl} to ${item.filename}...`);
                await downloadFile(bestUrl, dest);

            } else {
                console.log(`No video found for ${item.query}`);
            }

        } catch (e) {
            console.error(`Error processing ${item.query}:`, e.message);
        }
    }

    await browser.close();
})();
