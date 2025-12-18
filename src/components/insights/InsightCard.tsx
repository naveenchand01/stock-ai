import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface InsightCardProps {
  title: string;
  icon: LucideIcon;
  items: {
    symbol: string;
    value: string;
    change: number;
  }[];
}

export function InsightCard({ title, icon: Icon, items }: InsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="font-medium text-sm">{item.symbol}</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">{item.value}</span>
              <span className={`font-mono text-xs ${item.change >= 0 ? "text-success" : "text-destructive"}`}>
                {item.change >= 0 ? "+" : ""}{item.change}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
