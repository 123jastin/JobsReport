import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyChcgu2yOmsugrh2rjc9KhZWe6sD2yZqqI",
  authDomain: "unera-50aae.firebaseapp.com",
  projectId: "unera-50aae",
  storageBucket: "unera-50aae.firebasestorage.app",
  messagingSenderId: "649631105841",
  appId: "1:649631105841:web:23c6ecfdb4de6ad52ca610"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(messaging, {
      vapidKey: 'BKjdfhksdfhksdjfhksjdf...' // ← REPLACE WITH YOUR VAPID KEY
    });

    return token;
  } catch (err) {
    console.error('Notification permission error:', err);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  return onMessage(messaging, callback);
}
