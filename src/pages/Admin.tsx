import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Shield,
    Settings,
    BarChart3,
    Users,
    Bell,
    Clock,
    Mail,
    MessageCircle,
    Chrome,
    AlertTriangle,
    TrendingUp
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    getAdminSettings,
    updateAdminSettings,
    getNotificationStats,
    type AdminSettings,
    type NotificationStats
} from '@/services/admin.service';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Admin = () => {
    const [settings, setSettings] = useState<AdminSettings | null>(null);
    const [stats, setStats] = useState<NotificationStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [adminSettings, notifStats] = await Promise.all([
                getAdminSettings(),
                getNotificationStats(),
            ]);
            setSettings(adminSettings);
            setStats(notifStats);
        } catch (error) {
            console.error('Failed to load admin data:', error);
            toast.error('Failed to load admin settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!settings) return;

        setSaving(true);
        try {
            await updateAdminSettings(settings);
            toast.success('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const updateGlobalLimit = (key: string, value: any) => {
        if (!settings) return;
        setSettings({
            ...settings,
            globalNotificationLimits: {
                ...settings.globalNotificationLimits,
                [key]: value,
            },
        });
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                        <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Shield className="h-8 w-8 text-primary" />
                            Admin Dashboard
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage notification limits and system settings
                        </p>
                    </div>
                    <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Bell className="h-4 w-4 text-primary" />
                                Total Alerts Sent
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalAlertsSent || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">All time</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Mail className="h-4 w-4 text-blue-500" />
                                Email Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.emailsSent || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">All time</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <MessageCircle className="h-4 w-4 text-green-500" />
                                WhatsApp Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.whatsappSent || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">All time</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-orange-500" />
                                Last 24 Hours
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.last24Hours || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Recent activity</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Main Settings Tabs */}
            <Tabs defaultValue="limits" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="limits">Notification Limits</TabsTrigger>
                    <TabsTrigger value="system">System Settings</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                {/* Notification Limits Tab */}
                <TabsContent value="limits">
                    <Card>
                        <CardHeader>
                            <CardTitle>Global Notification Limits</CardTitle>
                            <CardDescription>
                                Configure rate limiting to prevent notification spam
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Daily Limit */}
                            <div className="grid gap-2">
                                <Label htmlFor="maxAlertsPerDay" className="flex items-center gap-2">
                                    <Bell className="h-4 w-4" />
                                    Maximum Alerts Per Day
                                </Label>
                                <Input
                                    id="maxAlertsPerDay"
                                    type="number"
                                    value={settings?.globalNotificationLimits.maxAlertsPerDay || 50}
                                    onChange={(e) => updateGlobalLimit('maxAlertsPerDay', parseInt(e.target.value))}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Users won't receive more than this many alerts in 24 hours
                                </p>
                            </div>

                            {/* Hourly Limit */}
                            <div className="grid gap-2">
                                <Label htmlFor="maxAlertsPerHour" className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Maximum Alerts Per Hour
                                </Label>
                                <Input
                                    id="maxAlertsPerHour"
                                    type="number"
                                    value={settings?.globalNotificationLimits.maxAlertsPerHour || 10}
                                    onChange={(e) => updateGlobalLimit('maxAlertsPerHour', parseInt(e.target.value))}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Prevent bursts of alerts within a short time
                                </p>
                            </div>

                            {/* Cooldown Period */}
                            <div className="grid gap-2">
                                <Label htmlFor="minCooldownMinutes" className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Minimum Cooldown (minutes)
                                </Label>
                                <Input
                                    id="minCooldownMinutes"
                                    type="number"
                                    value={settings?.globalNotificationLimits.minCooldownMinutes || 15}
                                    onChange={(e) => updateGlobalLimit('minCooldownMinutes', parseInt(e.target.value))}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Minimum time between triggering the same alert
                                </p>
                            </div>

                            {/* Quiet Hours */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="quietHoursStart">Quiet Hours Start</Label>
                                    <Input
                                        id="quietHoursStart"
                                        type="time"
                                        value={settings?.globalNotificationLimits.quietHoursStart || '22:00'}
                                        onChange={(e) => updateGlobalLimit('quietHoursStart', e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="quietHoursEnd">Quiet Hours End</Label>
                                    <Input
                                        id="quietHoursEnd"
                                        type="time"
                                        value={settings?.globalNotificationLimits.quietHoursEnd || '08:00'}
                                        onChange={(e) => updateGlobalLimit('quietHoursEnd', e.target.value)}
                                    />
                                </div>
                                <p className="col-span-2 text-sm text-muted-foreground">
                                    No alerts will be sent during these hours
                                </p>
                            </div>

                            {/* Email Digest */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label>Enable Daily Email Digest</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Send a single daily summary instead of individual alerts
                                    </p>
                                </div>
                                <Switch
                                    checked={settings?.globalNotificationLimits.enableEmailDigest || false}
                                    onCheckedChange={(checked) => updateGlobalLimit('enableEmailDigest', checked)}
                                />
                            </div>

                            {settings?.globalNotificationLimits.enableEmailDigest && (
                                <div className="grid gap-2">
                                    <Label htmlFor="digestTime">Digest Send Time</Label>
                                    <Input
                                        id="digestTime"
                                        type="time"
                                        value={settings?.globalNotificationLimits.digestTime || '09:00'}
                                        onChange={(e) => updateGlobalLimit('digestTime', e.target.value)}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Time to send the daily digest email
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* System Settings Tab */}
                <TabsContent value="system">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Settings</CardTitle>
                            <CardDescription>
                                Global system configuration
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Enable Notifications */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="flex items-center gap-2">
                                        <Bell className="h-4 w-4" />
                                        Enable Notifications Globally
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Master switch for all notifications
                                    </p>
                                </div>
                                <Switch
                                    checked={settings?.enableNotifications || false}
                                    onCheckedChange={(checked) => setSettings({ ...settings!, enableNotifications: checked })}
                                />
                            </div>

                            {/* Maintenance Mode */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="flex items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        Maintenance Mode
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Disable all notifications during maintenance
                                    </p>
                                </div>
                                <Switch
                                    checked={settings?.maintenanceMode || false}
                                    onCheckedChange={(checked) => setSettings({ ...settings!, maintenanceMode: checked })}
                                />
                            </div>

                            {settings?.maintenanceMode && (
                                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                    <p className="text-sm text-orange-500 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Maintenance mode is active. All notifications are disabled.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Analytics</CardTitle>
                            <CardDescription>
                                Detailed statistics and user activity
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-secondary rounded-lg">
                                        <p className="text-2xl font-bold text-primary">{stats?.emailsSent || 0}</p>
                                        <p className="text-sm text-muted-foreground mt-1">Email Alerts</p>
                                    </div>
                                    <div className="text-center p-4 bg-secondary rounded-lg">
                                        <p className="text-2xl font-bold text-green-500">{stats?.whatsappSent || 0}</p>
                                        <p className="text-sm text-muted-foreground mt-1">WhatsApp Alerts</p>
                                    </div>
                                    <div className="text-center p-4 bg-secondary rounded-lg">
                                        <p className="text-2xl font-bold text-blue-500">{stats?.browserPushSent || 0}</p>
                                        <p className="text-sm text-muted-foreground mt-1">Browser Push</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-3">Alerts by User</h3>
                                    <div className="space-y-2">
                                        {Object.entries(stats?.byUser || {}).map(([userId, count]) => (
                                            <div key={userId} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                                                <span className="text-sm font-mono">{userId.substring(0, 12)}...</span>
                                                <span className="text-sm font-semibold">{count} alerts</span>
                                            </div>
                                        ))}
                                        {Object.keys(stats?.byUser || {}).length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-8">
                                                No user activity yet
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    );
};

export default Admin;
