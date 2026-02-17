
const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');
const path = require('path');

const searches = [
    // Trying to find a "man in suit" or "dark cinematic barber"
    { query: 'man suit walking', filename: 'video_mafioso_barber.mp4' },
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

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    for (const item of searches) {
        // Using Mixkit as it was reliable before
        const url = `https://mixkit.co/free-stock-video/${encodeURIComponent(item.query)}/?orientation=vertical`;
        console.log(`Searching: ${url}`);

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 2000));

            let videoSrc = await page.evaluate(() => {
                const v = document.querySelector('video');
                return v ? (v.currentSrc || v.src) : null;
            });

            if (videoSrc) {
                console.log(`Found preview: ${videoSrc}`);

                // Try to upgrade quality if possible (Mixkit pattern)
                if (videoSrc.includes('-360.mp4')) {
                    // Try 720p blindly, if it fails we fall back to 360p (handled by just using what we found if we cant verify)
                    // For now, let's keep it simple and grab what we see to ensure it works.
                }

                const dest = path.join(__dirname, 'public', item.filename);
                await downloadFile(videoSrc, dest);
            } else {
                console.log(`No video found for ${item.query}`);
            }

        } catch (e) {
            console.error(`Error processing ${item.query}:`, e.message);
        }
    }

    await browser.close();
})();
