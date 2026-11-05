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
 * Ensures the firebase-messaging-sw.js service worker is registered, updated and active.
 * Cleans up stale push subscriptions from previous VAPID keys to avoid "Registration failed - push service error".
 */
async function getOrRegisterActiveServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Workers are not supported in this browser environment.');
  }

  // 1. Get existing registration or register anew
  let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
  if (!registration) {
    registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
  }

  // 2. If a push subscription already exists with an old/previous VAPID key, unsubscribe it first
  // Browsers throw "Registration failed - push service error" if you subscribe with a new key while an old one is registered
  try {
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) {
      console.log('[NEERPATH FCM] Clearing prior push subscription to renew with active VAPID key...');
      await existingSub.unsubscribe();
    }
  } catch (subErr) {
    console.warn('[NEERPATH FCM] Notice when checking prior push subscription:', subErr);
  }

  // 3. Ensure the service worker is active
  if (registration.installing) {
    await new Promise<void>((resolve) => {
      const sw = registration!.installing!;
      sw.addEventListener('statechange', function onStateChange() {
        if (sw.state === 'activated') {
          sw.removeEventListener('statechange', onStateChange);
          resolve();
        }
      });
    });
  }

  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  // 4. Await navigator.serviceWorker.ready
  const readyRegistration = await navigator.serviceWorker.ready;
  return readyRegistration;
}

/**
 * Requests browser notification permission and retrieves an FCM registration token.
 * Gracefully handles permission denial, unsupported browsers, or missing/mismatched keys.
 */
export async function requestFCMToken(): Promise<{
  token: string | null;
  error?: string;
  errorDetails?: string;
  permission: NotificationPermission;
}> {
  if (typeof window === 'undefined') {
    return { token: null, error: 'SSR environment', permission: 'default' };
  }

  const currentPermission = Notification.permission;

  const supported = await isPushNotificationSupported();
  if (!supported) {
    return {
      token: null,
      error: 'Push notifications are not supported in this browser or private browsing mode.',
      permission: currentPermission
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        token: null,
        error: 'Notification permission was denied. Please allow notifications in browser site permissions.',
        permission
      };
    }

    if (!firebaseApp) {
      return { token: null, error: 'Firebase app is not configured.', permission };
    }

    if (!messagingInstance) {
      messagingInstance = getMessaging(firebaseApp);
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();
    const activeRegistration = await getOrRegisterActiveServiceWorker();

    let token: string | null = null;
    try {
      token = await getToken(messagingInstance, {
        vapidKey: vapidKey || undefined,
        serviceWorkerRegistration: activeRegistration,
      });
    } catch (tokenErr: any) {
      const msg = tokenErr?.message || '';
      console.warn('[NEERPATH Firebase FCM] getToken attempt failed:', tokenErr);

      if (msg.includes('push service error') || msg.includes('Registration failed')) {
        return {
          token: null,
          error: 'Browser push service rejected subscription (push service error).',
          errorDetails: 'Please clear site cookies/service workers for localhost in browser DevTools (Application > Storage > Clear site data) or restart your browser to clear cached PushManager keys.',
          permission
        };
      }
      throw tokenErr;
    }

    if (token) {
      return { token, permission };
    } else {
      return { token: null, error: 'No FCM registration token received from push service.', permission };
    }
  } catch (err: any) {
    console.warn('[NEERPATH Firebase FCM] Error getting token:', err);
    return {
      token: null,
      error: err?.message || 'Failed to retrieve FCM push token.',
      permission: Notification.permission
    };
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
