/**
 * NEERPATH Firebase Client Integration
 * Reusable initialization module for Firebase App, Analytics, and Cloud Messaging (FCM).
 * Preserves Supabase authentication and database architecture.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from 'firebase/analytics';
import { getMessaging, getToken, onMessage, isSupported as isMessagingSupported, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let firebaseApp: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let messagingInstance: Messaging | null = null;

// Initialize Firebase App singleton
if (typeof window !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

    // Analytics (conditional check)
    isAnalyticsSupported().then((supported) => {
      if (supported && firebaseApp) {
        analytics = getAnalytics(firebaseApp);
      }
    }).catch(() => {});
  } catch (err) {
    console.warn('[NEERPATH Firebase] Initialization error:', err);
  }
}

export { firebaseApp, analytics };

/**
 * Checks if browser environment supports Firebase Cloud Messaging push notifications.
 */
export async function isPushNotificationSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return false;
  }
  return await isMessagingSupported();
}

/**
 * Requests browser notification permission and retrieves an FCM registration token.
 * Uses VAPID public key from VITE_FIREBASE_VAPID_KEY.
 * Gracefully handles permission denial, unsupported browsers, or missing keys.
 */
export async function requestFCMToken(): Promise<{ token: string | null; error?: string; permission: NotificationPermission }> {
  if (typeof window === 'undefined') {
    return { token: null, error: 'SSR environment', permission: 'default' };
  }

  const currentPermission = Notification.permission;

  const supported = await isPushNotificationSupported();
  if (!supported) {
    return { token: null, error: 'Push notifications not supported by this browser.', permission: currentPermission };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { token: null, error: 'Notification permission was not granted by the user.', permission };
    }

    if (!firebaseApp) {
      return { token: null, error: 'Firebase app is not configured.', permission };
    }

    if (!messagingInstance) {
      messagingInstance = getMessaging(firebaseApp);
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      return {
        token: null,
        error: 'VAPID key is missing in frontend/.env. Generate in Firebase Console → Cloud Messaging → Web Push certificates.',
        permission
      };
    }

    // Register service worker if not already registered
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });

    const token = await getToken(messagingInstance, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      return { token, permission };
    } else {
      return { token: null, error: 'No FCM registration token available.', permission };
    }
  } catch (err: any) {
    console.warn('[NEERPATH Firebase FCM] Error getting token:', err);
    return { token: null, error: err?.message || 'Failed to retrieve FCM token.', permission: Notification.permission };
  }
}

/**
 * Attaches a foreground push notification listener.
 */
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  if (typeof window === 'undefined' || !firebaseApp) return null;

  try {
    if (!messagingInstance) {
      messagingInstance = getMessaging(firebaseApp);
    }
    return onMessage(messagingInstance, (payload) => {
      console.log('[NEERPATH Firebase FCM] Foreground Message Received:', payload);
      callback(payload);
    });
  } catch (err) {
    console.warn('[NEERPATH Firebase FCM] Error registering foreground listener:', err);
    return null;
  }
}

