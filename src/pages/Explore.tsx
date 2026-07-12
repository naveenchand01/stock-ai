import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTopGainers, useTopLosers, useHighVolume } from "@/hooks/useStocks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { TopStock } from "@/types/stock.types";

const Explore = () => {
    const { data: gainers = [], isLoading: loadingGainers } = useTopGainers();
    const { data: losers = [], isLoading: loadingLosers } = useTopLosers();
    const { data: volume = [], isLoading: loadingVolume } = useHighVolume();

    const renderStockList = (stocks: TopStock[]) => {
        return (
            <div className="glass-card rounded-xl overflow-hidden mt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead className="text-right">Market Price</TableHead>
                            <TableHead className="text-right">Volume</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stocks.map((stock) => (
                            <TableRow key={stock.symbol}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                            {stock.symbol.substring(0, 1)}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{stock.name || stock.symbol}</div>
                                            <div className="text-sm text-muted-foreground">{stock.symbol}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="font-medium">₹{stock.price ? stock.price.toFixed(2) : stock.value}</div>
                                    <div className={`text-sm font-mono ${(stock.changePercent ?? stock.change) >= 0 ? 'text-success' : 'text-destructive'}`}>
                                        {(stock.changePercent ?? stock.change) >= 0 ? '+' : ''}{(stock.changePercent ?? stock.change ?? 0).toFixed(2)}%
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="font-medium">{stock.volume ? stock.volume.toLocaleString() : '-'}</div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {stocks.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                    No stocks found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Explore Market</h1>
                    <p className="text-muted-foreground">Discover top performing and high volume stocks today.</p>
                </div>

                <Tabs defaultValue="gainers" className="w-full">
                    <TabsList className="bg-secondary/50">
                        <TabsTrigger value="gainers" className="gap-2">
                            <TrendingUp className="h-4 w-4" /> Top gainers
                        </TabsTrigger>
                        <TabsTrigger value="losers" className="gap-2">
                            <TrendingDown className="h-4 w-4" /> Top losers
                        </TabsTrigger>
                        <TabsTrigger value="volume" className="gap-2">
                            <BarChart3 className="h-4 w-4" /> High volume
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="gainers">
                        {loadingGainers ? <div className="text-center py-10 text-muted-foreground">Loading market data...</div> : renderStockList(gainers)}
                    </TabsContent>

                    <TabsContent value="losers">
                        {loadingLosers ? <div className="text-center py-10 text-muted-foreground">Loading market data...</div> : renderStockList(losers)}
                    </TabsContent>

                    <TabsContent value="volume">
                        {loadingVolume ? <div className="text-center py-10 text-muted-foreground">Loading market data...</div> : renderStockList(volume)}
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default Explore;
