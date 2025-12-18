import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, ArrowRight, BarChart3, Brain, Newspaper, Bell } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">AI</span>
              </div>
              <span className="font-semibold text-lg">Stock AI</span>
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/dashboard">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/dashboard">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 chart-grid opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px]" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="gradient-text">AI-Driven Avatar System</span> for Real-Time{" "}
                <span className="gradient-text">Stock Market News Presentation</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Forecast. Narrate. Personalize Your Finance. Experience market insights
                like never before with AI-powered analysis and real-time briefings.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Button variant="hero" size="xl" asChild>
                <Link to="/dashboard">
                  Launch Dashboard
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="gap-2">
                <Play className="h-5 w-5" />
                Watch Demo Video
              </Button>
            </motion.div>

            {/* Avatar Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative max-w-3xl mx-auto"
            >
              <div className="glass-card p-8 rounded-2xl">
                <div className="aspect-video bg-secondary rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 chart-grid opacity-20" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  
                  {/* Avatar Placeholder */}
                  <div className="relative z-10 text-center">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-primary/20 border-2 border-primary animate-pulse-glow flex items-center justify-center">
                      <Brain className="h-16 w-16 text-primary" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      "Apple rises 2.3% after quarterly earnings beat expectations..."
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -left-4 glass-card p-3 rounded-lg"
              >
                <BarChart3 className="h-6 w-6 text-primary" />
              </motion.div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                className="absolute -top-4 -right-4 glass-card p-3 rounded-lg"
              >
                <Newspaper className="h-6 w-6 text-success" />
              </motion.div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-4 right-12 glass-card p-3 rounded-lg"
              >
                <Bell className="h-6 w-6 text-warning" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features for Smart Investing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to stay ahead of the market
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Brain,
                title: "AI Avatar Briefings",
                description: "Get personalized market summaries narrated by your AI assistant",
              },
              {
                icon: BarChart3,
                title: "Advanced Forecasting",
                description: "LSTM, ARIMA, and XGBoost models for price predictions",
              },
              {
                icon: Newspaper,
                title: "Sentiment Analysis",
                description: "Real-time news and social media sentiment tracking",
              },
              {
                icon: Bell,
                title: "Smart Alerts",
                description: "Custom triggers for price, volume, and sentiment changes",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 text-center hover:border-primary/30 transition-colors"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted APIs */}
      <section className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Trusted APIs & Data Sources
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {["Alpha Vantage", "Polygon", "Yahoo Finance", "Reuters", "Bloomberg"].map(
              (api, index) => (
                <span key={index} className="text-lg font-medium">
                  {api}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-lg font-semibold mb-2">Group 4</h3>
            <p className="text-sm text-muted-foreground mb-6">Team Members</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
              {["Naveen Chand", "Pratham Singh", "Suman Mandal", "Lokesh Ghosh", "Riya Singh", "Santanu Ghosh"].map((member) => (
                <div key={member} className="glass-card p-3 rounded-lg">
                  <p className="text-sm font-medium">{member}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 Stock AI. For informational purposes only. Not financial advice.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
