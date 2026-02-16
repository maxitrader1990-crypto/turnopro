
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('🎬 Iniciando captura de screenshots de la app...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });

    try {
        const page = await browser.newPage();
        const navOptions = { waitUntil: 'domcontentloaded', timeout: 30000 };

        // Login
        console.log('📱 Autenticando...');
        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto('http://localhost:5173/login', navOptions);
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', 'maxitrader1990@gmail.com');
        await page.type('input[type="password"]', 'admin123');
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation(navOptions).catch(() => { })
        ]);
        await new Promise(r => setTimeout(r, 2000));

        // Forzar navegación a dashboard
        await page.goto('http://localhost:5173/dashboard', navOptions);
        await new Promise(r => setTimeout(r, 3000));

        // 1. Dashboard Desktop (actualizado)
        console.log('📊 Capturando Dashboard Desktop...');
        await page.setViewport({ width: 1920, height: 1080 });
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: 'public/dashboard-desktop.png', fullPage: false });

        // 2. Dashboard Mobile
        console.log('📱 Capturando Dashboard Mobile...');
        await page.setViewport({ width: 390, height: 844, isMobile: true });
        await page.reload(navOptions);
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: 'public/dashboard-mobile.png', fullPage: false });

        // 3. Calendario/Agenda (si existe)
        console.log('📅 Capturando Calendario...');
        await page.setViewport({ width: 1920, height: 1080 });
        try {
            await page.goto('http://localhost:5173/panel/citas', navOptions);
            await new Promise(r => setTimeout(r, 2000));
            await page.screenshot({ path: 'public/calendar-view.png', fullPage: false });
        } catch (e) {
            console.log('⚠️ No se pudo capturar calendario');
        }

        // 4. Clientes (si existe)
        console.log('👥 Capturando Clientes...');
        try {
            await page.goto('http://localhost:5173/panel/clientes', navOptions);
            await new Promise(r => setTimeout(r, 2000));
            await page.screenshot({ path: 'public/clients-view.png', fullPage: false });
        } catch (e) {
            console.log('⚠️ No se pudo capturar clientes');
        }

        // 5. Booking Page Mobile (actualizado)
        console.log('📲 Capturando Booking Mobile...');
        await page.setViewport({ width: 390, height: 844, isMobile: true });
        try {
            await page.goto('http://localhost:5173/book/demo', navOptions);
            await new Promise(r => setTimeout(r, 2000));
            await page.screenshot({ path: 'public/booking-mobile.png', fullPage: false });
        } catch (e) {
            console.log('⚠️ No se pudo capturar booking mobile');
        }

        console.log('✅ Capturas completadas!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await browser.close();
        console.log('🎬 Proceso terminado.');
    }
})();
