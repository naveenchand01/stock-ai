import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { StockSearch } from '@/components/market/StockSearch';
import { type AlertRule } from '@/services/alerts.service';

interface CreateAlertDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateAlert: (alert: Omit<AlertRule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
}

export function CreateAlertDialog({ open, onOpenChange, onCreateAlert }: CreateAlertDialogProps) {
    const [symbol, setSymbol] = useState('');
    const [type, setType] = useState<'price_above' | 'price_below' | 'percent_change'>('price_above');
    const [threshold, setThreshold] = useState('');
    const [notifyEmail, setNotifyEmail] = useState(true);
    const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);
    const [notifyBrowser, setNotifyBrowser] = useState(false);

    const handleCreate = () => {
        if (!symbol || !threshold) {
            return;
        }

        onCreateAlert({
            symbol,
            type,
            threshold: parseFloat(threshold),
            active: true,
            notifyEmail,
            notifyWhatsApp,
            notifyBrowser,
        });

        // Reset form
        setSymbol('');
        setThreshold('');
        setNotifyEmail(true);
        setNotifyWhatsApp(false);
        setNotifyBrowser(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Price Alert</DialogTitle>
                    <DialogDescription>
                        Get notified when a stock reaches your target price
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Stock Selection */}
                    <div className="grid gap-2">
                        <Label htmlFor="stock">Stock Symbol</Label>
                        <StockSearch
                            onSelect={setSymbol}
                            selectedSymbol={symbol}
                            placeholder="Search for a stock..."
                        />
                    </div>

                    {/* Alert Type */}
                    <div className="grid gap-2">
                        <Label htmlFor="type">Alert Type</Label>
                        <Select value={type} onValueChange={(value: any) => setType(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="price_above">Price goes above</SelectItem>
                                <SelectItem value="price_below">Price goes below</SelectItem>
                                <SelectItem value="percent_change">Percent change</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Threshold */}
                    <div className="grid gap-2">
                        <Label htmlFor="threshold">
                            {type === 'percent_change' ? 'Percentage (%)' : 'Price ($)'}
                        </Label>
                        <Input
                            id="threshold"
                            type="number"
                            step={type === 'percent_change' ? '0.1' : '0.01'}
                            placeholder={type === 'percent_change' ? 'e.g., 5' : 'e.g., 180.00'}
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                        />
                    </div>

                    {/* Notification Channels */}
                    <div className="grid gap-3 pt-2">
                        <Label>Notify me via:</Label>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">📧 Email</span>
                            </div>
                            <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">📱 WhatsApp</span>
                                <span className="text-xs text-muted-foreground">(Configure in settings)</span>
                            </div>
                            <Switch checked={notifyWhatsApp} onCheckedChange={setNotifyWhatsApp} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">🔔 Browser</span>
                            </div>
                            <Switch checked={notifyBrowser} onCheckedChange={setNotifyBrowser} />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!symbol || !threshold}>
                        Create Alert
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
