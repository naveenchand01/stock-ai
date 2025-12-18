import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface MiniChartProps {
  data: { value: number }[];
  color?: "success" | "destructive" | "primary";
  height?: number;
}

export function MiniChart({ data, color = "primary", height = 60 }: MiniChartProps) {
  const colorMap = {
    success: "hsl(142, 71%, 45%)",
    destructive: "hsl(0, 72%, 51%)",
    primary: "hsl(173, 80%, 50%)",
  };

  const fillColor = colorMap[color];

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity={0.4} />
              <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={fillColor}
            strokeWidth={2}
            fill={`url(#gradient-${color})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
