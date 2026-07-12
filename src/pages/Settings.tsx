import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sparkles, User, Tag, Bell, Mail, MessageSquare, X, Loader2 } from "lucide-react";
import { BrowserPushSettings } from "@/components/notifications/BrowserPushSettings";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseService } from "@/services/supabase.service";
import { getNotificationPreferences, updateNotificationPreferences, NotificationPreferences } from "@/services/alerts.service";
import { toast } from "sonner";

const Personalization = () => {
  const { user } = useAuth();
  const [persona, setPersona] = useState("swing");
  const [interests, setInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    browserEnabled: false,
    emailEnabled: false,
    whatsappEnabled: false,
    email: "",
    whatsapp: "",
  });

  useEffect(() => {
    async function fetchPreferences() {
      if (!user?.uid) { setIsLoading(false); return; }
      try {
        const [profile, prefs] = await Promise.all([
          supabaseService.getProfile(user.uid),
          getNotificationPreferences(user.uid)
        ]);
        if (profile) {
          if (profile.persona) setPersona(profile.persona);
          if (profile.interests) setInterests(profile.interests);
        }
        if (prefs) {
          setNotifPrefs(prefs);
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPreferences();
  }, [user]);

  const handleSave = async () => {
    if (!user?.uid) {
      toast.error("You must be logged in to save preferences");
      return;
    }

    setIsSaving(true);
    try {
      await Promise.all([
        supabaseService.updatePersonalization(user.uid, persona, interests),
        updateNotificationPreferences(user.uid, notifPrefs)
      ]);
      toast.success("All preferences saved! AI insights and notifications are now personalised.");
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to update preferences: ${err.message || JSON.stringify(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const personas = [
    { id: "casual", label: "Casual", description: "Long-term, low maintenance" },
    { id: "swing", label: "Swing Trader", description: "Days to weeks holding" },
    { id: "longterm", label: "Long Term", description: "Buy and hold strategy" },
    { id: "options", label: "Options", description: "Derivatives focused" },
  ];

  // Each interest label maps to a description shown to user + used by AI
  const availableInterests: { name: string; description: string }[] = [
    { name: "Tech", description: "IT, Software, Semiconductors" },
    { name: "Banking", description: "Banks, NBFCs, Fintech" },
    { name: "Crypto", description: "Bitcoin, Altcoins, Web3" },
    { name: "Healthcare", description: "Pharma, Biotech, Hospitals" },
    { name: "Energy", description: "Oil, Gas, Renewables" },
    { name: "Real Estate", description: "REITs, Builders, Infrastructure" },
    { name: "Consumer", description: "FMCG, Retail, D2C Brands" },
    { name: "Industrial", description: "Manufacturing, Engineering" },
    { name: "Utilities", description: "Power, Water, Telecom" },
    { name: "Materials", description: "Metals, Mining, Chemicals" },
    { name: "Auto", description: "Automobiles, EV, Auto parts" },
    { name: "Defence", description: "Defence manufacturing, aerospace" },
    { name: "PSU", description: "Public sector undertakings" },
    { name: "Smallcap", description: "High-growth small companies" },
  ];

  const addInterest = (interest: string) => {
    if (!interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold">Personalization Center</h1>
        <p className="text-muted-foreground">Customize your AI-powered experience</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investment Persona */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Your Investment Persona</h2>
              <p className="text-sm text-muted-foreground">Select your trading style</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {personas.map((p) => (
              <motion.button
                key={p.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPersona(p.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${persona === p.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/50 hover:border-primary/50"
                  }`}
              >
                <div className="font-medium mb-1">{p.label}</div>
                <div className="text-xs text-muted-foreground">{p.description}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Interest Tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
              <Tag className="h-5 w-5 text-success" />
            </div>
            <div>
              <h2 className="font-semibold">Interest Tags</h2>
              <p className="text-sm text-muted-foreground">Select sectors that power your AI experience</p>
            </div>
          </div>

          {/* Selected Interests */}
          {interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {interests.map((interest) => (
                <motion.span
                  key={interest}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm"
                >
                  {interest}
                  <button
                    onClick={() => removeInterest(interest)}
                    className="hover:bg-primary/30 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.span>
              ))}
            </div>
          )}

          {/* Available Interests */}
          <div className="flex flex-wrap gap-2">
            {availableInterests
              .filter((i) => !interests.includes(i.name))
              .map((interest) => (
                <motion.button
                  key={interest.name}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => addInterest(interest.name)}
                  title={interest.description}
                  className="flex flex-col items-start px-3 py-2 rounded-lg bg-secondary text-muted-foreground text-sm hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/30"
                >
                  <span className="font-medium">+ {interest.name}</span>
                  <span className="text-xs text-muted-foreground/70">{interest.description}</span>
                </motion.button>
              ))}
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            ✨ These tags shape what news topics appear on your News page and how the AI Assistant answers your questions.
          </p>
        </motion.div>

        {/* Communication Preferences — connected to Supabase user_preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Bell className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h2 className="font-semibold">Notification Channels</h2>
              <p className="text-sm text-muted-foreground">Configure where and how you receive stock alerts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Push Notifications */}
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Browser Push</span>
                </div>
                <Switch
                  checked={notifPrefs.browserEnabled}
                  onCheckedChange={async (checked) => {
                    if (checked) {
                      if (!("Notification" in window)) {
                        toast.error("Browser push not supported on this device");
                        return;
                      }
                      const permission = await Notification.requestPermission();
                      if (permission !== "granted") {
                        toast.error("Notification permission denied by browser");
                        return;
                      }
                      toast.success("Browser push notifications enabled!");
                    }
                    setNotifPrefs({ ...notifPrefs, browserEnabled: checked })
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {notifPrefs.browserEnabled ? "✅ Active — instant stock alerts will appear at the top of your screen" : "Disabled — toggle for instant stock alerts at the top of your screen"}
              </p>
            </div>

            {/* Email */}
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Email Alerts</span>
                </div>
                <Switch
                  checked={notifPrefs.emailEnabled}
                  onCheckedChange={(checked) =>
                    setNotifPrefs({ ...notifPrefs, emailEnabled: checked })
                  }
                />
              </div>
              <input
                type="email"
                placeholder="your@email.com"
                value={notifPrefs.email || ""}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, email: e.target.value })}
                className="w-full h-9 rounded-lg bg-background border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {notifPrefs.emailEnabled && !notifPrefs.email && (
                <p className="text-xs text-destructive mt-1">Enter your email address</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-2">
                Receive a daily morning summary of your portfolio and news.
              </p>
            </div>

            {/* WhatsApp */}
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">WhatsApp Alerts</span>
                </div>
                <Switch
                  checked={notifPrefs.whatsappEnabled}
                  onCheckedChange={(checked) =>
                    setNotifPrefs({ ...notifPrefs, whatsappEnabled: checked })
                  }
                />
              </div>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={notifPrefs.whatsapp || ""}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, whatsapp: e.target.value })}
                className="w-full h-9 rounded-lg bg-background border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {notifPrefs.whatsappEnabled && !notifPrefs.whatsapp && (
                <p className="text-xs text-destructive mt-1">Enter phone number with country code</p>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            📌 Alert notifications fire when your Watchlist stock thresholds are breached. A single daily digest is sent via email and WhatsApp.
          </p>
        </motion.div>

        {/* Browser Push Notifications Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <BrowserPushSettings />
        </motion.div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-center"
      >
        <Button variant="hero" size="xl" onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5 mr-2" />
          )}
          {isSaving ? "Saving..." : "Save & Tune AI Recommendations"}
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          Your persona and interests power the AI stock suggestions and news feed
        </p>
      </motion.div>
    </DashboardLayout>
  );
};

export default Personalization;
