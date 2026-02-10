self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        self.registration.unregister().then(() => {
            console.log('Service Worker unregistered successfully.');
            return self.clients.claim();
        })
    );
});
