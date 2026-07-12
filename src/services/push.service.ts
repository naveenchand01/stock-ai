/**
 * Service for managing browser push notifications
 */

let publicVapidKey: string | null = null;
let pushSubscription: PushSubscription | null = null;

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications');
    }

    if (!('serviceWorker' in navigator)) {
        throw new Error('This browser does not support service workers');
    }

    if (!('PushManager' in window)) {
        throw new Error('This browser does not support push notifications');
    }

    const permission = await Notification.requestPermission();
    return permission;
};

/**
 * Get VAPID public key from backend
 */
const getPublicKey = async (): Promise<string> => {
    if (publicVapidKey) {
        return publicVapidKey;
    }

    const response = await fetch('http://localhost:3001/api/notifications/vapid-key');
    const data = await response.json();

    if (!data.publicKey) {
        throw new Error('VAPID public key not available');
    }

    publicVapidKey = data.publicKey;
    return publicVapidKey;
};

/**
 * Convert base64 string to Uint8Array
 */
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
};

/**
 * Register service worker
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
    if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers not supported');
    }

    const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
    });

    console.log('Service Worker registered:', registration);
    return registration;
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPush = async (): Promise<PushSubscription> => {
    try {
        // Request permission
        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
            throw new Error('Notification permission denied');
        }

        // Register service worker
        const registration = await registerServiceWorker();

        // Get VAPID public key
        const publicKey = await getPublicKey();

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
        });

        pushSubscription = subscription;
        console.log('Push subscription:', subscription);

        // TODO: Send subscription to backend to store in Firestore
        // await saveSubscriptionToServer(subscription);

        return subscription;
    } catch (error) {
        console.error('Error subscribing to push:', error);
        throw error;
    }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPush = async (): Promise<void> => {
    if (!pushSubscription) {
        return;
    }

    await pushSubscription.unsubscribe();
    pushSubscription = null;

    // TODO: Remove subscription from backend
    // await removeSubscriptionFromServer();
};

/**
 * Check if user is subscribed to push
 */
export const isSubscribed = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        return subscription !== null;
    } catch {
        return false;
    }
};

/**
 * Get current push subscription
 */
export const getSubscription = async (): Promise<PushSubscription | null> => {
    if (!('serviceWorker' in navigator)) {
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        return subscription;
    } catch {
        return null;
    }
};

/**
 * Test browser push notification (show local notification)
 */
export const testNotification = async (): Promise<void> => {
    const permission = await requestNotificationPermission();

    if (permission === 'granted') {
        new Notification('Test Notification', {
            body: 'Browser push notifications are working!',
            icon: '/logo192.png',
            tag: 'test-notification',
        });
    }
};
