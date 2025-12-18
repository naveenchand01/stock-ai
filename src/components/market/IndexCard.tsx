import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface IndexCardProps {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export function IndexCard({ name, value, change, changePercent }: IndexCardProps) {
  const isPositive = change >= 0;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`flex-shrink-0 glass-card p-4 min-w-48 border-l-2 ${
        isPositive ? "border-l-success" : "border-l-destructive"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{name}</span>
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-success" />
        ) : (
          <TrendingDown className="h-4 w-4 text-destructive" />
        )}
      </div>
      <div className="font-mono text-xl font-semibold mb-1">
        {value.toLocaleString()}
      </div>
      <div className={`font-mono text-sm ${isPositive ? "text-success" : "text-destructive"}`}>
        {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
      </div>
    </motion.div>
  );
}
