
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Timeout config
        const navOptions = { waitUntil: 'domcontentloaded', timeout: 30000 };

        // 1. Login
        console.log('Navigating to Login...');
        await page.goto('http://localhost:5173/login', navOptions);

        console.log('Typing credentials...');
        // Wait for inputs
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', 'maxitrader1990@gmail.com');
        await page.type('input[type="password"]', 'admin123');

        console.log('Submitting...');
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation(navOptions).catch(e => console.log('Navigation wait timeout, proceeding...'))
        ]);

        // Wait a bit for client side routing
        await new Promise(r => setTimeout(r, 2000));

        console.log('Current URL:', page.url());

        // Check if login succeeded 
        if (!page.url().includes('dashboard')) {
            console.log('Warning: URL is ' + page.url());
            // Try manual navigation to dashboard just in case
            await page.goto('http://localhost:5173/dashboard', navOptions);
            await new Promise(r => setTimeout(r, 3000));
        }

        // 2. Capture Dashboard (Desktop)
        console.log('Capturing Dashboard...');
        await page.setViewport({ width: 1920, height: 1080 });
        await new Promise(r => setTimeout(r, 3000)); // wait for charts
        await page.screenshot({ path: 'public/dashboard-mockup.png' });
        console.log('Saved dashboard-mockup.png');

        // 3. Capture Booking Page (Mobile)
        // Trying to find a booking page. Let's try /book/demo-barbershop or similar
        // Or if that 404s, try /panel/citas (which shows the agenda)

        console.log('Capturing Mobile View...');
        await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

        // Try known booking URL or fallback to dashboard mobile view
        // The user mentioned "booking app", let's try to capture the public booking page if we can guess the slug
        // Or capture the mobile dashboard stats as requested "captura de mi app en el desktop" was for dashboard.
        // For mobile he said "subo capturas del movil". But I can try to capture mobile dashboard too.

        // Let's try to capture the mobile dashboard first as a safe bet for "app view"
        await page.goto('http://localhost:5173/dashboard', navOptions);
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: 'public/mobile-dashboard.png' });
        console.log('Saved mobile-dashboard.png');

        // Also try to capture a booking page if possible
        try {
            await page.goto('http://localhost:5173/book/demo', navOptions);
            await new Promise(r => setTimeout(r, 2000));
            // Check if 404
            const content = await page.content();
            if (!content.includes('404')) {
                await page.screenshot({ path: 'public/booking-mockup.png' });
                console.log('Saved booking-mockup.png from /book/demo');
            } else {
                // Fallback: Copy mobile dashboard to booking mockup
                console.log('Booking page not found, using mobile dashboard as booking mockup.');
                fs.copyFileSync('public/mobile-dashboard.png', 'public/booking-mockup.png');
            }
        } catch (e) {
            console.log('Failed to reach booking page, using mobile dashboard.');
            if (fs.existsSync('public/mobile-dashboard.png')) {
                fs.copyFileSync('public/mobile-dashboard.png', 'public/booking-mockup.png');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
        console.log('Done.');
    }
})();
