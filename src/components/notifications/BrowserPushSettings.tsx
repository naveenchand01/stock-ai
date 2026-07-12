import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, Chrome } from 'lucide-react';
import {
    requestNotificationPermission,
    subscribeToPush,
    unsubscribeFromPush,
    isSubscribed,
    testNotification
} from '@/services/push.service';
import { toast } from 'sonner';

export function BrowserPushSettings() {
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        checkSubscriptionStatus();
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const checkSubscriptionStatus = async () => {
        const status = await isSubscribed();
        setSubscribed(status);
    };

    const handleEnablePush = async () => {
        setLoading(true);
        try {
            await subscribeToPush();
            setSubscribed(true);
            setPermission('granted');
            toast.success('Browser push notifications enabled!');

            // Show test notification
            setTimeout(() => {
                testNotification();
            }, 1000);
        } catch (error: any) {
            console.error('Failed to enable push: ', error);
            toast.error(error.message || 'Failed to enable push notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleDisablePush = async () => {
        setLoading(true);
        try {
            await unsubscribeFromPush();
            setSubscribed(false);
            toast.success('Browser push notifications disabled');
        } catch (error) {
            console.error('Failed to disable push:', error);
            toast.error('Failed to disable push notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleTestNotification = async () => {
        try {
            await testNotification();
            toast.success('Test notification sent!');
        } catch (error) {
            toast.error('Failed to send test notification');
        }
    };

    if (!('Notification' in window)) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BellOff className="h-5 w-5 text-muted-foreground" />
                        Browser Notifications Not Supported
                    </CardTitle>
                    <CardDescription>
                        Your browser doesn't support push notifications
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Chrome className="h-5 w-5" />
                    Browser Push Notifications
                </CardTitle>
                <CardDescription>
                    Get instant alerts on your desktop or mobile browser
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">
                            Status: {subscribed ? (
                                <span className="text-success">Enabled ✓</span>
                            ) : (
                                <span className="text-muted-foreground">Disabled</span>
                            )}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Permission: {permission}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {subscribed ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handleTestNotification}
                                >
                                    Test
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDisablePush}
                                    disabled={loading}
                                >
                                    <BellOff className="h-4 w-4 mr-2" />
                                    Disable
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={handleEnablePush}
                                disabled={loading}
                                className="gap-2"
                            >
                                <Bell className="h-4 w-4" />
                                {loading ? 'Enabling...' : 'Enable Push Notifications'}
                            </Button>
                        )}
                    </div>
                </div>

                {permission === 'denied' && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive">
                            ⚠️ Notification permission denied. Please allow notifications in your browser settings.
                        </p>
                    </div>
                )}

                {subscribed && (
                    <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                        <p className="text-sm text-success">
                            ✓ You'll receive browser notifications when your alerts trigger!
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
