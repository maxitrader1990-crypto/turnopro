
const https = require('https');
const fs = require('fs');
const path = require('path');

const downloads = [
    { url: 'https://loremflickr.com/1080/1920/barber,dark', filename: 'barber_viral.jpg' },
    { url: 'https://loremflickr.com/1080/1920/man,phone', filename: 'bored_client.jpg' },
    { url: 'https://loremflickr.com/1080/1920/barbershop,interior', filename: 'busy_shop.jpg' },
    { url: 'https://loremflickr.com/1080/1920/chair,dark', filename: 'empty_chair.jpg' }
];

const downloadFile = (url, filepath) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        const request = https.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                let location = response.headers.location;
                if (location.startsWith('/')) {
                    location = 'https://loremflickr.com' + location;
                }
                console.log(`Redirecting to ${location}`);
                return downloadFile(location, filepath).then(resolve).catch(reject);
            }

            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${path.basename(filepath)}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { }); // Delete the file async. (But we don't check the result)
            reject(err);
        });
    });
};

(async () => {
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
    }

    for (const item of downloads) {
        console.log(`Downloading ${item.filename}...`);
        try {
            await downloadFile(item.url, path.join(publicDir, item.filename));
        } catch (error) {
            console.error(`Error downloading ${item.filename}:`, error.message);
            // Fallback: Create a dummy file or handled in react
        }
    }
})();
