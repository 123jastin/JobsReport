importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyChcgu2yOmsugrh2rjc9KhZWe6sD2yZqqI",
  authDomain: "unera-50aae.firebaseapp.com",
  projectId: "unera-50aae",
  storageBucket: "unera-50aae.firebasestorage.app",
  messagingSenderId: "649631105841",
  appId: "1:649631105841:web:23c6ecfdb4de6ad52ca610"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: '/logo-192.png',
      badge: '/favicon-32x32.png',
      data: payload.data || {},
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'View Job' },
        { action: 'close', title: 'Dismiss' }
      ]
    }
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' && event.notification.data?.url) {
    clients.openWindow(event.notification.data.url);
  } else {
    clients.openWindow('https://jobsreport.online/market');
  }
});
