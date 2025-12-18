import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { forecastData, watchlistStocks } from "@/data/mockData";
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  ReferenceLine 
} from "recharts";
import { motion } from "framer-motion";
import { useState } from "react";
import { TrendingUp, Gauge, Activity, Zap, AlertTriangle, Info } from "lucide-react";

const Forecast = () => {
  const [selectedModel, setSelectedModel] = useState("LSTM");
  const [selectedStock] = useState(watchlistStocks[0]);
  const models = ["LSTM", "ARIMA", "XGBoost"];

  const metrics = [
    { label: "Trend", value: forecastData.trend, icon: TrendingUp, color: "text-success" },
    { label: "Confidence", value: `${forecastData.confidence}%`, icon: Gauge, color: "text-primary" },
    { label: "Volatility", value: forecastData.volatility, icon: Activity, color: "text-warning" },
    { label: "Momentum", value: forecastData.momentum, icon: Zap, color: "text-success" },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold">
            Forecast for <span className="text-primary">{selectedStock.symbol}</span>
          </h1>
          <p className="text-muted-foreground">{selectedStock.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Choose Model:</span>
          {models.map((model) => (
            <Button
              key={model}
              variant={selectedModel === model ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedModel(model)}
            >
              {model}
            </Button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2"
        >
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Time-Series Forecast</h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Historical</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-muted-foreground">Prediction</span>
                </div>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData.prediction}>
                  <defs>
                    <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(173, 80%, 50%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(173, 80%, 50%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
                    domain={['dataMin - 10', 'dataMax + 10']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 9%)',
                      border: '1px solid hsl(222, 30%, 18%)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                  />
                  <ReferenceLine x={30} stroke="hsl(215, 20%, 35%)" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(173, 80%, 50%)"
                    strokeWidth={2}
                    fill="url(#historicalGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Prediction Zone Label */}
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>Shaded region represents prediction interval</span>
            </div>
          </div>
        </motion.div>

        {/* Metrics Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="font-semibold">AI Interpretation</h3>
          
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="glass-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center ${metric.color}`}>
                    <metric.icon className="h-5 w-5" />
                  </div>
                  <span className="text-muted-foreground">{metric.label}</span>
                </div>
                <span className={`font-semibold text-lg ${metric.color}`}>{metric.value}</span>
              </div>
            </motion.div>
          ))}

          {/* Risk Assessment */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card p-4 border-warning/30"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span className="font-semibold">Risk Assessment</span>
            </div>
            <div className="flex gap-2">
              {["Buy", "Hold", "Wait"].map((action) => (
                <Button
                  key={action}
                  variant={action === "Hold" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                >
                  {action}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              *Not Financial Advice
            </p>
          </motion.div>

          {/* Model Info */}
          <div className="glass-card p-4 bg-secondary/30">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{selectedModel}</span> model trained on 
              5 years of historical data with {forecastData.confidence}% accuracy on validation set.
            </p>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Forecast;
