import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AIChat } from "@/components/ai/AIChat";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseService } from "@/services/supabase.service";
import { ArrowLeft, Sparkles, Bot, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const Avatar = () => {
  const { user } = useAuth();
  const { watchlist } = useWatchlist();
  const [selectedStock, setSelectedStock] = useState<string | undefined>(undefined);
  const [userPersona, setUserPersona] = useState<string | undefined>(undefined);
  const [userInterests, setUserInterests] = useState<string[] | undefined>(undefined);

  useEffect(() => {
    async function loadPersona() {
      if (!user?.uid) return;
      try {
        const profile = await supabaseService.getProfile(user.uid);
        if (profile) {
          setUserPersona(profile.persona);
          setUserInterests(profile.interests);
        }
      } catch (err) {
        console.error("Failed to load persona for Avatar:", err);
      }
    }
    loadPersona();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                AI Stock Assistant
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              </h1>
              <p className="text-muted-foreground">
                Ask me anything about the stock market
              </p>
            </div>
          </div>

          {watchlist.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Tracking {watchlist.length} stock{watchlist.length !== 1 ? 's' : ''} in your watchlist
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2"
        >
          <div className="glass-card h-[calc(100vh-280px)] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Chat with AI Assistant</h2>
              {selectedStock && (
                <span className="ml-auto text-sm text-muted-foreground">
                  Analyzing: <span className="font-mono text-foreground">{selectedStock}</span>
                </span>
              )}
            </div>

            {/* Chat Component */}
            <AIChat symbol={selectedStock} watchlist={watchlist} persona={userPersona} interests={userInterests} />
          </div>
        </motion.div>

        {/* Sidebar - Watchlist & Context */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 space-y-4"
        >
          {/* Your Watchlist */}
          <div className="glass-card p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Your Watchlist
            </h3>

            {watchlist.length > 0 ? (
              <div className="space-y-2">
                {watchlist.map((stock) => (
                  <Button
                    key={stock}
                    variant={selectedStock === stock ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedStock(stock === selectedStock ? undefined : stock)}
                  >
                    <span className="font-mono">{stock}</span>
                    {selectedStock === stock && (
                      <Sparkles className="h-3 w-3 ml-auto" />
                    )}
                  </Button>
                ))}

                {selectedStock && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedStock(undefined)}
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <p>No stocks in your watchlist.</p>
                <p className="mt-2">Add stocks from the Dashboard to get started!</p>
              </div>
            )}
          </div>

          {/* AI Capabilities */}
          <div className="glass-card p-4">
            <h3 className="font-semibold mb-3">What I Can Do</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                <span>Analyze stock performance and trends</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                <span>Explain market movements and news</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                <span>Provide trading insights and patterns</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                <span>Answer investment questions</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                <span>Speak responses with voice synthesis</span>
              </li>
            </ul>
          </div>

          {/* Tips */}
          <div className="glass-card p-4 bg-primary/5 border-primary/20">
            <h3 className="font-semibold mb-2 text-primary">💡 Pro Tips</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Select a stock for context-aware analysis</li>
              <li>• Try "Explain why [STOCK] is moving"</li>
              <li>• Ask for comparisons between stocks</li>
              <li>• Toggle voice to hear responses</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Avatar;
