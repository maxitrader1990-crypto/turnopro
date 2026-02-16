
const fs = require('fs');

function createSVG(filename, text, bgColor, textColor, width = 1920, height = 1080) {
    const svgContent = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${bgColor}"/>
    <rect x="50" y="50" width="${width - 100}" height="${height - 100}" fill="none" stroke="${textColor}" stroke-width="20"/>
    <text x="50%" y="50%" font-family="Arial" font-size="80" font-weight="bold" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${text}</text>
    <text x="50%" y="80%" font-family="Arial" font-size="40" fill="${textColor}" text-anchor="middle" opacity="0.7">REPLACE WITH REAL STOCK ASSET</text>
</svg>`;

    fs.writeFileSync(`public/${filename}`, svgContent);
    console.log(`Generated ${filename}`);
}

function createUIMockupSVG(filename, title, type = 'mobile') {
    const width = type === 'mobile' ? 1080 : 1920;
    const height = type === 'mobile' ? 1920 : 1080;
    const bgColor = '#111';
    const textColor = '#FFD700';

    let contentRects = '';
    for (let i = 0; i < 5; i++) {
        const y = (type === 'mobile' ? 250 : 200) + (i * 250);
        contentRects += `<rect x="50" y="${y}" width="${width - 100}" height="200" fill="#333" rx="20"/>`;
    }

    const svgContent = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${bgColor}"/>
    
    <!-- Header -->
    <rect width="100%" height="${type === 'mobile' ? 200 : 150}" fill="#222"/>
    <text x="50" y="${type === 'mobile' ? 130 : 100}" font-family="Arial" font-size="60" font-weight="bold" fill="${textColor}">TurnoPro Mockup</text>
    
    <!-- Content Simulation -->
    ${contentRects}

    <!-- Overlay -->
    <rect x="0" y="${height / 2 - 150}" width="100%" height="300" fill="rgba(0,0,0,0.8)"/>
    <text x="50%" y="50%" font-family="Arial" font-size="80" font-weight="bold" fill="#FFF" text-anchor="middle" dominant-baseline="middle">${title}</text>
    <text x="50%" y="${height / 2 + 80}" font-family="Arial" font-size="40" fill="#AAA" text-anchor="middle">Use Browser Screenshot Here</text>
</svg>`;

    fs.writeFileSync(`public/${filename}`, svgContent);
    console.log(`Generated ${filename}`);
}

// Ensure public dir exists
if (!fs.existsSync('public')) {
    fs.mkdirSync('public', { recursive: true });
}

// Generate Stock Placeholders
createSVG('modern_urban_barber_shop.svg', 'STOCK: URBAN BARBER SHOP', '#1a1a1a', '#FFD700');
createSVG('gold_barber_tools.svg', 'STOCK: GOLD TOOLS', '#222', '#C0C0C0');
createSVG('chaos_appointment_book.svg', 'STOCK: CHAOS & MESS', '#300', '#F00');
createSVG('happy_customer.svg', 'STOCK: HAPPY CUSTOMER', '#1a1a1a', '#0F0');

// Generate UI Mockups
createUIMockupSVG('booking-mockup.svg', 'Booking Page', 'mobile');
createUIMockupSVG('dashboard-mockup.svg', 'Admin Dashboard', 'desktop');
createUIMockupSVG('mobile-dashboard.svg', 'Mobile Stats', 'mobile');
