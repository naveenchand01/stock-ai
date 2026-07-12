import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    watchlist: string[];
    createdAt: Date;
    updatedAt: Date;
}

const USERS_COLLECTION = 'users';

/**
 * Create or update user profile in Firestore
 */
export const createUserProfile = async (uid: string, email: string, displayName?: string): Promise<void> => {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        const profile: UserProfile = {
            uid,
            email,
            displayName: displayName || null,
            watchlist: ['TCS', 'INFY', 'RELIANCE', 'HDFCBANK', 'ICICIBANK'], // Default watchlist
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await setDoc(userRef, profile);
    }
};

/**
 * Get user watchlist from Firestore
 */
export const getUserWatchlist = async (uid: string): Promise<string[]> => {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
        return userDoc.data().watchlist || [];
    }
    return [];
};

/**
 * Add stock to user watchlist
 */
export const addToWatchlist = async (uid: string, symbol: string): Promise<void> => {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
        watchlist: arrayUnion(symbol),
        updatedAt: new Date(),
    });
};

/**
 * Remove stock from user watchlist
 */
export const removeFromWatchlist = async (uid: string, symbol: string): Promise<void> => {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
        watchlist: arrayRemove(symbol),
        updatedAt: new Date(),
    });
};

/**
 * Set entire watchlist (replace)
 */
export const setWatchlist = async (uid: string, symbols: string[]): Promise<void> => {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
        watchlist: symbols,
        updatedAt: new Date(),
    });
};

/**
 * Alert settings interface
 */
export interface AlertSetting {
    symbol: string;
    priceAlert: boolean;
    volumeSpike: boolean;
    negativeSentiment: boolean;
    analystDowngrade: boolean;
    priceThreshold?: number;
    volumeThresholdMultiplier?: number; // e.g., 2x average volume
}

/**
 * Save alert settings for user in Firestore
 */
export const saveAlertSettings = async (uid: string, alerts: AlertSetting[]): Promise<void> => {
    const alertsRef = doc(db, USERS_COLLECTION, uid, 'settings', 'alerts');
    await setDoc(alertsRef, {
        alerts,
        updatedAt: new Date(),
    }, { merge: true });
};

/**
 * Get alert settings for user from Firestore
 */
export const getAlertSettings = async (uid: string): Promise<AlertSetting[] | null> => {
    const alertsRef = doc(db, USERS_COLLECTION, uid, 'settings', 'alerts');
    const alertDoc = await getDoc(alertsRef);

    if (alertDoc.exists()) {
        return alertDoc.data().alerts || null;
    }
    return null;
};
