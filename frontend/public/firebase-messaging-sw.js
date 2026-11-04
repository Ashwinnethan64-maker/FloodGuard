/* eslint-disable no-undef */
// NEERPATH Firebase Cloud Messaging Service Worker
// Handles background flood alerts, road blockages, and emergency push notifications

importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDRjwe1NSPoCYsAhe9108tGpOB5BnxQ3E4",
  authDomain: "neerpath.firebaseapp.com",
  projectId: "neerpath",
  storageBucket: "neerpath.firebasestorage.app",
  messagingSenderId: "683810545961",
  appId: "1:683810545961:web:2dd1711843ea6bb6f0d738"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background Push Received:', payload);

  const notificationTitle = payload.notification?.title || 'NEERPATH Flood Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'Road condition update in Mangaluru.',
    icon: '/vite.svg',
    badge: '/vite.svg',
    data: payload.data || {},
    tag: payload.data?.alert_id || 'neerpath-flood-alert',
    renotify: true,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

