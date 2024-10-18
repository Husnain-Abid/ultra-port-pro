importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');

workbox.setConfig({
    debug: true
});


workbox.routing.registerRoute(
    new RegExp('https://d10mhq06fikmnr.cloudfront.net/static/version1724338874/frontend/Creativestyle/theme-megaport/fr_FR.+\.(?:png|gif|jpg|jpeg|webp|svg|js|css|html|json)$'),
    new workbox.strategies.CacheFirst({
        cacheName: 'static',
        plugins: [
            new workbox.expiration.Plugin({
                maxEntries: 300,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
            }),
        ],
    })
);


workbox.routing.registerRoute(
    new RegExp('https://d10mhq06fikmnr.cloudfront.net/.+\.(?:png|gif|jpg|jpeg|webp|svg|js|css|html)$'),
    new workbox.strategies.CacheFirst({
        cacheName: 'media',
        plugins: [
            new workbox.expiration.Plugin({
                maxEntries: 300,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
            }),
        ],
    })
);


workbox.routing.registerRoute(
    /navigation\/mobile\/index/,
    new workbox.strategies.CacheFirst({
        cacheName: 'mobile-navigation',
        plugins: [
            new workbox.expiration.Plugin({
                maxEntries: 1,
            }),
        ],
    })
);


workbox.routing.registerRoute(
    /review\/product\/listAjax/,
    new workbox.strategies.StaleWhileRevalidate({
        cacheName: 'product-reviews',
    })
);


// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.
workbox.routing.registerRoute(
    /^https:\/\/fonts\.googleapis\.com/,
    new workbox.strategies.StaleWhileRevalidate({
        cacheName: 'google-fonts-stylesheets',
    })
);

// Cache the underlying font files with a cache-first strategy for 1 year.
workbox.routing.registerRoute(
    /^https:\/\/fonts\.gstatic\.com/,
    new workbox.strategies.CacheFirst({
        cacheName: 'google-fonts-webfonts',
        plugins: [
            new workbox.cacheableResponse.Plugin({
                statuses: [0, 200],
            }),
            new workbox.expiration.Plugin({
                maxAgeSeconds: 60 * 60 * 24 * 365,
                maxEntries: 30,
            }),
        ],
    })
);

workbox.routing.registerRoute(
    ({
        event
    }) => new URL(event.request.url).origin === self.location.origin,
    new workbox.strategies.NetworkFirst({
        cacheName: 'offline-pages',
        plugins: [
            new workbox.expiration.Plugin({
                maxEntries: 60,
                maxAgeSeconds: 60 * 60, // 1 Hour
            }),
        ],
    })
);


const offlinePageUrl = '/';

workbox.precaching.precacheAndRoute([
    offlinePageUrl
]);

workbox.routing.setCatchHandler(({
    event: {
        request
    }
}) => {
    switch (request.destination) {
        case 'document':
            return caches.match(request.url)
                .then(response => response || caches.match(offlinePageUrl))
                .catch(() => caches.match(offlinePageUrl));
            break;
        default:
            return Response.error();
    }
});


self.addEventListener('push', function(event) {
    var options = JSON.parse(event.data.text());
    var title = options['title'] === undefined || options['title'] === null ? 'Megaport' : options['title'];

    if (options.icon === undefined) {
        options.icon = 'https://d10mhq06fikmnr.cloudfront.net/static/version1724338874/frontend/Creativestyle/theme-megaport/fr_FR/Magento_Theme/icon-512x512.png';
    }

    if (options.badge === undefined) {
        options.badge = 'https://d10mhq06fikmnr.cloudfront.net/static/version1724338874/frontend/Creativestyle/theme-megaport/fr_FR/Magento_Theme/badge-72x72.png';
    }

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(e) {
    var notification = e.notification;
    var action = e.action;

    if (action === 'close') {
        notification.close();
    } else {
        if (
            notification.data != null &&
            notification.data.url != null && notification.data.url !== ''
        ) {
            clients.openWindow(notification.data.url);
        }
        notification.close();
    }
});

self.addEventListener('pushsubscriptionchange', function(event) {
    if (event.oldSubscription && event.newSubscription) {
        event.waitUntil(
            fetch('/rest/V1/pwa/device_information', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    oldEndpoint: event.oldSubscription.endpoint,
                    endpoint: event.newSubscription.endpoint,
                    keys: event.newSubscription.toJSON().keys
                })
            })
        );
    }
});