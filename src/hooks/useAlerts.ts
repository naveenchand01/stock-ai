import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    getUserAlerts,
    createAlert,
    deleteAlert,
    toggleAlert,
    type AlertRule
} from '@/services/alerts.service';
import { toast } from 'sonner';

export function useAlerts() {
    const { user } = useAuth();
    const [alerts, setAlerts] = useState<AlertRule[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch user alerts
    useEffect(() => {
        async function fetchAlerts() {
            if (!user?.uid) {
                setAlerts([]);
                setLoading(false);
                return;
            }

            try {
                const userAlerts = await getUserAlerts(user.uid);
                setAlerts(userAlerts);
            } catch (error) {
                console.error('Failed to fetch alerts:', error);
                toast.error('Failed to load alerts');
            } finally {
                setLoading(false);
            }
        }

        fetchAlerts();
    }, [user]);

    // Create new alert
    const addAlert = async (alert: Omit<AlertRule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!user?.uid) {
            toast.error('Please sign in to create alerts');
            return;
        }

        try {
            const alertId = await createAlert(user.uid, alert);
            const newAlert: AlertRule = {
                ...alert,
                id: alertId,
                userId: user.uid,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            setAlerts(prev => [...prev, newAlert]);
            toast.success(`Alert created for ${alert.symbol}`);
        } catch (error) {
            console.error('Failed to create alert:', error);
            toast.error('Failed to create alert');
        }
    };

    // Delete alert
    const removeAlert = async (alertId: string) => {
        try {
            await deleteAlert(alertId);
            setAlerts(prev => prev.filter(a => a.id !== alertId));
            toast.success('Alert deleted');
        } catch (error) {
            console.error('Failed to delete alert:', error);
            toast.error('Failed to delete alert');
        }
    };

    // Toggle alert active status
    const toggleAlertStatus = async (alertId: string, active: boolean) => {
        try {
            await toggleAlert(alertId, active);
            setAlerts(prev => prev.map(a =>
                a.id === alertId ? { ...a, active } : a
            ));
            toast.success(active ? 'Alert enabled' : 'Alert disabled');
        } catch (error) {
            console.error('Failed to toggle alert:', error);
            toast.error('Failed to update alert');
        }
    };

    return {
        alerts,
        loading,
        addAlert,
        removeAlert,
        toggleAlertStatus,
    };
}
