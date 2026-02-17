
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Mixkit URL
    const url = 'https://mixkit.co/free-stock-video/barber/';
    console.log(`Navigating to ${url}...`);

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait a bit
        await new Promise(r => setTimeout(r, 5000));

        // Take screenshot
        await page.screenshot({ path: 'mixkit_debug.png' });
        console.log('Saved screenshot.');

        // Dump HTML
        const html = await page.content();
        fs.writeFileSync('mixkit_debug.html', html);
        console.log('Saved HTML.');

        // Try to find video
        const videos = await page.evaluate(() => {
            const vids = Array.from(document.querySelectorAll('video'));
            return vids.map(v => v.src || v.currentSrc);
        });

        console.log('Found videos:', videos);

    } catch (e) {
        console.error('Error:', e);
    }

    await browser.close();
})();
