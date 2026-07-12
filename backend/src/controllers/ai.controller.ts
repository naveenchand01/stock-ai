import { Request, Response } from 'express';
import { geminiService } from '../services/gemini.service';
import { stocksService } from '../services/stocks.service';
import logger from '../utils/logger';

export class AIController {
    /**
     * POST /api/ai/chat
     * Interactive chat with AI Avatar
     */
    async chat(req: Request, res: Response) {
        try {
            const { message, context } = req.body;

            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }

            // Build context-aware prompt
            const personaDescriptions: Record<string, string> = {
                casual: 'a casual investor who prefers low-maintenance, long-term, buy-and-hold strategies',
                swing: 'a swing trader who holds positions for days to weeks, focusing on technical setups and short-term momentum',
                longterm: 'a long-term investor focused on fundamentals, compounding, and wealth-building over years',
                options: 'an options trader interested in derivatives, Greeks, implied volatility, and options strategies',
            };

            const personaDesc = context?.persona ? personaDescriptions[context.persona] || 'a stock market investor' : 'a stock market investor';
            const interestsDesc = context?.interests && context.interests.length > 0
                ? `The user is particularly interested in: ${context.interests.join(', ')}.`
                : '';

            let prompt = `You are a friendly and knowledgeable stock market AI assistant for Indian and global markets. 
You are speaking to ${personaDesc}. ${interestsDesc}
Tailor your response to their trading style — use appropriate terminology, time horizons, and risk levels that suit their profile.
Always be specific, practical, and actionable.

User Question: ${message}`;

            // Add stock context if provided
            if (context?.symbol) {
                try {
                    const stock = await stocksService.getQuote(context.symbol);
                    prompt += `\n\nContext: The user is asking about ${stock.name} (${stock.symbol}), currently trading at ₹${stock.price.toFixed(2)}, ${stock.change >= 0 ? 'up' : 'down'} ${Math.abs(stock.changePercent).toFixed(2)}% today.`;
                } catch (error) {
                    logger.warn(`Failed to fetch context for ${context.symbol}`);
                }
            }

            if (context?.watchlist && context.watchlist.length > 0) {
                prompt += `\n\nThe user's watchlist includes: ${context.watchlist.join(', ')}.`;
            }

            prompt += `\n\nProvide a helpful, concise response (2-4 sentences) suited to their investor profile. Be friendly and informative.`;

            // Generate response using Gemini
            const text = await geminiService.generate(prompt, 'gemini-flash-latest');
            return res.json({ response: text });
        } catch (error: any) {
            logger.error('Error in AI chat:', error);
            return res.status(500).json({
                error: error.message || 'Failed to process chat message',
                response: "I'm having trouble connecting right now. Please try again in a moment."
            });
        }
    }

    /**
     * POST /api/ai/summarize-news
     * Summarize recent news for a stock
     */
    async summarizeNews(req: Request, res: Response) {
        try {
            const { symbol, newsItems } = req.body;

            if (!symbol || !newsItems || !Array.isArray(newsItems)) {
                return res.status(400).json({ error: 'Symbol and newsItems are required' });
            }

            const prompt = `Summarize the following recent news about ${symbol} in 2-3 sentences:

${newsItems.map((item: any, i: number) => `${i + 1}. ${item.headline} (${item.source})`).join('\n')}

Provide a concise summary focusing on the key themes and overall sentiment.`;

            const summary = await geminiService.generate(prompt, 'gemini-flash-latest');
            return res.json({ summary });
        } catch (error: any) {
            logger.error('Error summarizing news:', error);
            return res.status(500).json({ error: error.message || 'Failed to summarize news' });
        }
    }
}

export const aiController = new AIController();
