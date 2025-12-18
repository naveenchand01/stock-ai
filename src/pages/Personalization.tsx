import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sparkles, User, Tag, Bell, Mail, MessageSquare, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const Personalization = () => {
  const [persona, setPersona] = useState("swing");
  const [interests, setInterests] = useState(["Tech", "Banking", "Crypto"]);
  const [notifications, setNotifications] = useState({
    push: true,
    email: "weekly",
    whatsapp: "intraday",
  });

  const personas = [
    { id: "casual", label: "Casual", description: "Long-term, low maintenance" },
    { id: "swing", label: "Swing Trader", description: "Days to weeks holding" },
    { id: "longterm", label: "Long Term", description: "Buy and hold strategy" },
    { id: "options", label: "Options", description: "Derivatives focused" },
  ];

  const availableInterests = [
    "Tech", "Banking", "Crypto", "Healthcare", "Energy", 
    "Real Estate", "Consumer", "Industrial", "Utilities", "Materials"
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
        <h1 className="text-2xl font-bold">Marketing Personalization Center</h1>
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
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  persona === p.id
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
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
              <Tag className="h-5 w-5 text-success" />
            </div>
            <div>
              <h2 className="font-semibold">Interest Tags</h2>
              <p className="text-sm text-muted-foreground">Select sectors you follow</p>
            </div>
          </div>

          {/* Selected Interests */}
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

          {/* Available Interests */}
          <div className="flex flex-wrap gap-2">
            {availableInterests
              .filter((i) => !interests.includes(i))
              .map((interest) => (
                <motion.button
                  key={interest}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => addInterest(interest)}
                  className="px-3 py-1 rounded-full bg-secondary text-muted-foreground text-sm hover:bg-secondary/80 transition-colors"
                >
                  + {interest}
                </motion.button>
              ))}
          </div>
        </motion.div>

        {/* Communication Preferences */}
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
              <h2 className="font-semibold">Communication Preferences</h2>
              <p className="text-sm text-muted-foreground">Control how you receive updates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Push Notifications */}
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Push Notifications</span>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, push: checked })
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Instant browser notifications for important events
              </p>
            </div>

            {/* Email Digest */}
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Email Digest</span>
              </div>
              <select
                value={notifications.email}
                onChange={(e) =>
                  setNotifications({ ...notifications, email: e.target.value })
                }
                className="w-full h-10 rounded-lg bg-background border border-border px-3 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="off">Off</option>
              </select>
            </div>

            {/* WhatsApp Alerts */}
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">WhatsApp Alerts</span>
              </div>
              <select
                value={notifications.whatsapp}
                onChange={(e) =>
                  setNotifications({ ...notifications, whatsapp: e.target.value })
                }
                className="w-full h-10 rounded-lg bg-background border border-border px-3 text-sm"
              >
                <option value="realtime">Real-time</option>
                <option value="intraday">Intraday Summary</option>
                <option value="daily">Daily Digest</option>
                <option value="off">Off</option>
              </select>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-center"
      >
        <Button variant="hero" size="xl">
          <Sparkles className="h-5 w-5 mr-2" />
          Tune AI Recommendations
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          Your preferences help our AI deliver more relevant market insights
        </p>
      </motion.div>
    </DashboardLayout>
  );
};

export default Personalization;
