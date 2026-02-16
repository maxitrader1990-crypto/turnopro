// Test script to verify images are loading correctly
const fetch = require('node:http');

const BASE_URL = 'http://localhost:3000';
const IMAGES = [
    'modern_urban_barber_shop.jpg',
    'chaos_appointment_book.jpg',
    'gold_barber_tools.jpg',
    'booking-mockup.png',
    'dashboard-mockup.png'
];

console.log('🔍 Testing image availability on Remotion server...\n');

IMAGES.forEach(image => {
    const url = `${BASE_URL}/public/${image}`;
    console.log(`Testing: ${image}`);

    fetch.get(url, (res) => {
        if (res.statusCode === 200) {
            console.log(`✅ ${image} - OK (${res.statusCode})`);
        } else {
            console.log(`❌ ${image} - FAIL (${res.statusCode})`);
        }
    }).on('error', (err) => {
        console.log(`❌ ${image} - ERROR: ${err.message}`);
    });
});

console.log('\n💡 If all images show ✅, the problem is in the browser cache.');
console.log('   Try: Ctrl+Shift+R to force reload the page');
