
const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');
const path = require('path');

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

    // Try 'haircut' instead of 'barber' to be safe
    const query = 'haircut';
    const filename = 'video_barber_viral.mp4';
    const url = `https://mixkit.co/free-stock-video/${query}/?orientation=vertical`;
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
            const dest = path.join(__dirname, 'public', filename);
            await downloadFile(videoSrc, dest);
        } else {
            console.log(`No video found for ${query}`);
        }

    } catch (e) {
        console.error(`Error processing ${query}:`, e.message);
    }

    await browser.close();
})();
