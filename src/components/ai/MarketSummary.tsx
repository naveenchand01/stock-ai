import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MarketSummaryProps {
  className?: string;
}

export const MarketSummary = ({ className = '' }: MarketSummaryProps) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [error, setError] = useState<string>('');

  const fetchMarketSummary = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/stocks/market-summary');

      if (!response.ok) {
        throw new Error('Failed to fetch market summary');
      }

      const result = await response.json();
      setSummary(result.data.summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load market summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketSummary();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-md border-purple-500/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">
              AI Market Summary
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchMarketSummary}
            disabled={loading}
            className="text-purple-400 hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {loading && !summary && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm py-4">
            {error}
          </div>
        )}

        {summary && !loading && (
          <div className="text-gray-300 space-y-2">
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {summary}
            </p>
          </div>
        )}

        {!loading && !summary && !error && (
          <div className="text-gray-400 text-sm py-4">
            Click the refresh icon to generate market summary
          </div>
        )}
      </Card>
    </motion.div>
  );
};
