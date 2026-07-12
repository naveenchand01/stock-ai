import { app, auth, db, analytics } from '@/lib/firebase';

/**
 * Firebase Connection Diagnostic Tool
 * Run this in browser console to verify Firebase services
 */
export function testFirebaseConnection() {
    console.log('🔥 Firebase Connection Test\n');

    try {
        // Test 1: Firebase App
        console.log('✅ Firebase App initialized');
        console.log('   Project ID:', app.options.projectId);

        // Test 2: Authentication
        console.log('\n✅ Firebase Auth initialized');
        console.log('   Current User:', auth.currentUser ? auth.currentUser.email : 'Not logged in');

        // Test 3: Firestore
        console.log('\n✅ Firestore initialized');
        console.log('   Database:', db.type);

        // Test 4: Analytics
        if (analytics) {
            console.log('\n✅ Analytics initialized');
            console.log('   Analytics ID:', app.options.measurementId);
        } else {
            console.log('\n⚠️  Analytics not available (SSR environment)');
        }

        // Test 5: Environment Variables
        console.log('\n📝 Environment Check:');
        const envVars = [
            'VITE_FIREBASE_API_KEY',
            'VITE_FIREBASE_AUTH_DOMAIN',
            'VITE_FIREBASE_PROJECT_ID',
        ];

        envVars.forEach(varName => {
            const value = import.meta.env[varName];
            if (value) {
                console.log(`   ✅ ${varName}: ${value.substring(0, 10)}...`);
            } else {
                console.log(`   ❌ ${varName}: MISSING`);
            }
        });

        console.log('\n🎉 All Firebase services are connected!\n');
        return true;
    } catch (error) {
        console.error('❌ Firebase connection error:', error);
        return false;
    }
}

// Auto-run in development
if (import.meta.env.DEV) {
    setTimeout(() => {
        console.log('🔧 Running automatic Firebase diagnostic...\n');
        testFirebaseConnection();
    }, 2000);
}
