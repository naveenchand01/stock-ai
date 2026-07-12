import { apiClient } from './api';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface AIChatRequest {
    message: string;
    context?: {
        symbol?: string;
        watchlist?: string[];
        persona?: string;
        interests?: string[];
    };
}

export const aiApi = {
    /**
     * Send a message to AI Avatar
     */
    chat: async (request: AIChatRequest): Promise<string> => {
        const response: any = await apiClient.post('/ai/chat', request);
        return response?.response || response?.data?.response || "I'm sorry, I couldn't process that request.";
    },

    /**
     * Get market summary
     */
    getMarketSummary: async (): Promise<string> => {
        const response: any = await apiClient.get('/stocks/market-summary');
        return response?.summary || response?.data?.summary || response?.data?.data?.summary;
    },

    /**
     * Get stock-specific AI summary
     */
    getStockSummary: async (symbol: string): Promise<string> => {
        const response: any = await apiClient.get(`/stocks/ai-summary/${symbol}`);
        return response?.summary || response?.data?.summary || response?.data?.data?.summary;
    },

    /**
     * Get trading insights for a stock
     */
    getTradingInsights: async (symbol: string, period: string = '1mo'): Promise<string> => {
        const response: any = await apiClient.get(`/stocks/trading-insights/${symbol}?period=${period}`);
        return response?.insights || response?.data?.insights || response?.data?.data?.insights;
    },
};
