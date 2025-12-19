import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CandlestickChart } from '@/components/charts/CandlestickChart';
import { AIInsights } from '@/components/ai/AIInsights';
import { useStockQuote, useHistoricalData } from '@/hooks/useStocks';

const PERIOD_OPTIONS = [
  { label: '1D', value: '1d' },
  { label: '5D', value: '5d' },
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
];

export const StockDetails = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('1mo');

  // Fetch stock quote
  const { data: stock, isLoading: quoteLoading } = useStockQuote(symbol || '');

  // Fetch historical data
  const { data: historicalData, isLoading: historyLoading } = useHistoricalData(
    symbol || '',
    selectedPeriod,
    selectedPeriod === '1d' || selectedPeriod === '5d' ? '1h' : '1d'
  );

  if (!symbol) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-white">Invalid stock symbol</div>
      </div>
    );
  }

  if (quoteLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-white">Stock not found</div>
      </div>
    );
  }

  const isPositive = stock.change >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">{stock.symbol}</h1>
                <p className="text-gray-400">{stock.name}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                ${stock.price.toFixed(2)}
              </div>
              <div className={`flex items-center justify-end gap-1 ${
                isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {isPositive ? '+' : ''}
                  {stock.change.toFixed(2)} ({isPositive ? '+' : ''}
                  {stock.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/5 backdrop-blur-md border-white/10 p-6">
                <div className="space-y-4">
                  {/* Period Selector */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Price Chart</h2>
                    <div className="flex gap-2">
                      {PERIOD_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          variant={selectedPeriod === option.value ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setSelectedPeriod(option.value)}
                          className={
                            selectedPeriod === option.value
                              ? 'bg-purple-600 hover:bg-purple-700'
                              : 'text-gray-400 hover:bg-white/10 hover:text-white'
                          }
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Chart */}
                  {historyLoading ? (
                    <div className="flex items-center justify-center h-[400px]">
                      <div className="text-gray-400">Loading chart...</div>
                    </div>
                  ) : historicalData && historicalData.length > 0 ? (
                    <CandlestickChart data={historicalData} height={500} />
                  ) : (
                    <div className="flex items-center justify-center h-[400px]">
                      <div className="text-gray-400">No data available</div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Tabs Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6"
            >
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full bg-white/5 border-white/10">
                  <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                  <TabsTrigger value="stats" className="flex-1">Statistics</TabsTrigger>
                  <TabsTrigger value="analysis" className="flex-1">Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <Card className="bg-white/5 backdrop-blur-md border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Company Overview</h3>
                    <div className="text-gray-300 space-y-2">
                      <p>Detailed company information and business description would appear here.</p>
                      <p className="text-sm text-gray-400">
                        Data integration with company profiles coming soon.
                      </p>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="stats" className="mt-4">
                  <Card className="bg-white/5 backdrop-blur-md border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Key Statistics</h3>
                    <div className="text-gray-300">
                      <p className="text-sm text-gray-400">
                        Advanced statistics and metrics coming soon.
                      </p>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="analysis" className="mt-4">
                  <AIInsights symbol={symbol} type="insights" />
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Side Panel - AI Insights & Key Metrics */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <AIInsights symbol={symbol} type="summary" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="bg-white/5 backdrop-blur-md border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Key Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Current Price</span>
                    <span className="text-white font-medium">${stock.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Change</span>
                    <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
                      {isPositive ? '+' : ''}${stock.change.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Change %</span>
                    <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
                      {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="bg-white/5 backdrop-blur-md border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                <div className="space-y-3">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    Add to Watchlist
                  </Button>
                  <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                    Set Alert
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
