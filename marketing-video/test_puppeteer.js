
const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log('Launching test browser...');
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('Browser launched successfully.');
        await browser.close();
        console.log('Browser closed.');
    } catch (e) {
        console.error('Puppeteer failed:', e);
        process.exit(1);
    }
})();
