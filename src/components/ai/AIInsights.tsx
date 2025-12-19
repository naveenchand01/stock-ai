import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AIInsightsProps {
  symbol: string;
  type?: 'summary' | 'insights';
  className?: string;
}

export const AIInsights = ({ symbol, type = 'summary', className = '' }: AIInsightsProps) => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string>('');

  const fetchAIContent = async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint = type === 'summary'
        ? `/api/stocks/ai-summary/${symbol}`
        : `/api/stocks/trading-insights/${symbol}`;

      const response = await fetch(`http://localhost:3001${endpoint}`);

      if (!response.ok) {
        throw new Error('Failed to fetch AI insights');
      }

      const result = await response.json();
      setContent(type === 'summary' ? result.data.summary : result.data.insights);
    } catch (err: any) {
      setError(err.message || 'Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      fetchAIContent();
    }
  }, [symbol, type]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="bg-white/5 backdrop-blur-md border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">
              {type === 'summary' ? 'AI Stock Summary' : 'AI Trading Insights'}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAIContent}
            disabled={loading}
            className="text-purple-400 hover:bg-white/10"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {loading && !content && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm py-4">
            {error}
          </div>
        )}

        {content && !loading && (
          <div className="text-gray-300 space-y-2">
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {content}
            </p>
          </div>
        )}

        {!loading && !content && !error && (
          <div className="text-gray-400 text-sm py-4">
            Click the refresh icon to generate AI insights
          </div>
        )}
      </Card>
    </motion.div>
  );
};
