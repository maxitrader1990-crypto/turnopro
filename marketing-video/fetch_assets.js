
const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');
const path = require('path');

const searches = [
    { query: 'barber dark suit cinematic vertical', filename: 'barber_viral.jpg' },
    { query: 'bored man looking at phone vertical', filename: 'bored_client.jpg' },
    { query: 'busy barbershop interior modern vertical', filename: 'busy_shop.jpg' },
    { query: 'empty barber chair dark moody vertical', filename: 'empty_chair.jpg' }
];

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
            }
        });
    });
};

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920 });

    for (const item of searches) {
        console.log(`Searching for: ${item.query}...`);
        try {
            await page.goto(`https://www.pexels.com/search/${encodeURIComponent(item.query)}/`, { waitUntil: 'networkidle2' });

            // Extract image URLs
            const potentialImages = await page.evaluate(() => {
                const imgs = Array.from(document.querySelectorAll('img'));
                return imgs.map(img => img.src)
                    .filter(src => src.includes('images.pexels.com/photos') && !src.includes('avatar') && !src.includes('profile'));
            });

            if (potentialImages.length > 0) {
                // Get a high-res version if possible (replace tiny with large)
                // Pexels URLs often have ?auto=compress&cs=tinysrgb&w=... 
                // We want large height.
                let bestUrl = potentialImages[0];
                // Try to find one that looks like a main photo
                for (const url of potentialImages) {
                    if (url.includes('w=') || url.includes('h=')) {
                        bestUrl = url;
                        break;
                    }
                }

                console.log(`Found image: ${bestUrl}`);
                const dest = path.join(__dirname, 'public', item.filename);
                await downloadImage(bestUrl, dest);
                console.log(`Saved to ${item.filename}`);
            } else {
                console.log(`No images found for ${item.query}`);
            }
        } catch (e) {
            console.error(`Failed to fetch ${item.query}:`, e);
        }
    }

    await browser.close();
})();
