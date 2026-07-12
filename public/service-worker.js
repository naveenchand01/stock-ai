// Service Worker for Browser Push Notifications

// Listen for push events
self.addEventListener('push', (event) => {
    if (!event.data) {
        console.log('Push event but no data');
        return;
    }

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'Stock Alert',
            body: event.data.text(),
        };
    }

    const options = {
        body: data.body || 'Price alert triggered',
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/',
            symbol: data.symbol,
        },
        actions: [
            {
                action: 'view',
                title: 'View Details',
            },
            {
                action: 'close',
                title: 'Dismiss',
            },
        ],
        tag: data.tag || 'stock-alert',
        requireInteraction: true,
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Stock Alert', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Open the app
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Check if there's already a window open
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If not, open a new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Service worker activation
self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    event.waitUntil(clients.claim());
});

// Service worker installation
self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    self.skipWaiting();
});
