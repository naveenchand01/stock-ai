import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface MiniChartProps {
  data: { time?: number; value: number }[];
  color?: "success" | "destructive" | "primary";
  height?: number;
  showAxis?: boolean;
}

export function MiniChart({ data, color = "primary", height = 60, showAxis = false }: MiniChartProps) {
  const colorMap = {
    success: "hsl(142, 71%, 45%)",
    destructive: "hsl(0, 72%, 51%)",
    primary: "hsl(173, 80%, 50%)",
  };

  const fillColor = colorMap[color];

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity={0.4} />
              <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showAxis && (
            <>
              <XAxis
                dataKey="time"
                tickFormatter={(unixTime) => {
                  if (!unixTime) return '';
                  const date = new Date(unixTime * 1000);
                  // Determine formatting based on the general distance between points (crudely, if the span is > 1 day)
                  if (data.length > 2 && data[data.length - 1].time! - data[0].time! < 7 * 24 * 60 * 60) {
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }
                  return date.toLocaleDateString();
                }}
                minTickGap={30}
                tick={{ fontSize: 12, fill: '#888888' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(value) => value.toFixed(2)}
                tick={{ fontSize: 12, fill: '#888888' }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1b26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: fillColor }}
                labelFormatter={(unixTime) => new Date(Number(unixTime) * 1000).toLocaleString()}
                formatter={(value: number) => [`${value.toFixed(2)}`]}
              />
            </>
          )}
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
