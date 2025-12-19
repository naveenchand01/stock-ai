import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface StockCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export function StockCard({ symbol, name, price, change, changePercent }: StockCardProps) {
  const isPositive = change >= 0;

  return (
    <Link to={`/stock/${symbol}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="glass-card p-4 cursor-pointer transition-all hover:border-primary/30"
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-foreground">{symbol}</h3>
            <p className="text-xs text-muted-foreground truncate max-w-24">{name}</p>
          </div>
          <div className={`flex items-center gap-1 ${isPositive ? "text-success" : "text-destructive"}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <span className="font-mono text-lg font-semibold">${price.toFixed(2)}</span>
          <div className="text-right">
            <span className={`font-mono text-sm ${isPositive ? "text-success" : "text-destructive"}`}>
              {isPositive ? "+" : ""}{change.toFixed(2)}
            </span>
            <span className={`block font-mono text-xs ${isPositive ? "text-success" : "text-destructive"}`}>
              ({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
