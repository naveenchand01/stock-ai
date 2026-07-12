import { useState, useRef, useEffect } from 'react';
import { Send, Volume2, VolumeX, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { aiApi, type ChatMessage } from '@/services/ai.api';
import { ttsService } from '@/services/tts.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AIChatProps {
    symbol?: string;
    watchlist?: string[];
    persona?: string;
    interests?: string[];
}

export function AIChat({ symbol, watchlist, persona, interests }: AIChatProps) {
    const personaGreeting: Record<string, string> = {
        casual: "I see you're a casual long-term investor. Ask me about solid blue-chip stocks, index funds, or sector outlooks.",
        swing: "I see you're a swing trader. Ask me about momentum plays, resistance levels, or short-term catalysts.",
        longterm: "I see you invest for the long term. Ask me about fundamentals, dividend stocks, or compounding strategies.",
        options: "I see you trade options. Ask me about implied volatility, Greeks, or options strategies for your positions.",
    };
    const greeting = persona && personaGreeting[persona]
        ? personaGreeting[persona]
        : "Hello! I'm your AI stock market assistant. Ask me anything about the market, stocks, or your watchlist.";

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: greeting,
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (messageText?: string) => {
        const textToSend = messageText || input;
        if (!textToSend.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: textToSend.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await aiApi.chat({
                message: textToSend.trim(),
                context: {
                    symbol,
                    watchlist,
                    ...(persona ? { persona } : {}),
                    ...(interests && interests.length > 0 ? { interests } : {})
                },
            });

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Speak the response if TTS is enabled
            if (ttsEnabled) {
                speakMessage(response);
            }
        } catch (error) {
            console.error('Chat error:', error);
            toast.error('Failed to get response. Please try again.');

            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const speakMessage = (text: string) => {
        setIsSpeaking(true);
        ttsService.speak(text, {
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0,
            onEnd: () => setIsSpeaking(false),
            onStart: () => setIsSpeaking(true),
        });
    };

    const toggleSpeech = () => {
        if (isSpeaking) {
            ttsService.stop();
            setIsSpeaking(false);
        } else {
            setTtsEnabled(!ttsEnabled);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Quick action buttons — tailored to persona and interests
    const baseQuickActions = [
        { label: 'Market Summary', message: 'Give me a summary of today\'s market' },
        { label: 'Explain Trends', message: 'What are the major market trends right now?' },
        { label: 'Stock Analysis', message: symbol ? `Analyze ${symbol} for me` : 'Analyze my watchlist' },
        { label: 'Trading Insights', message: 'What should I watch out for today?' },
    ];
    const personaQuickActions: Record<string, { label: string; message: string }[]> = {
        casual: [
            { label: 'Long Term Picks', message: 'Suggest 3 solid long-term stocks from the Indian market for a conservative investor' },
            { label: 'Index Funds', message: 'Explain the best index funds available in India for a passive investor' },
        ],
        swing: [
            { label: 'Breakout Stocks', message: 'Which Nifty 500 stocks are showing bullish breakout patterns this week?' },
            { label: 'Momentum Plays', message: 'What sectors have strong momentum right now for swing trading?' },
        ],
        longterm: [
            { label: 'Dividend Stocks', message: 'List the top dividend-paying stocks in India for long-term holding' },
            { label: 'Fundamentals Check', message: `Explain how to evaluate the fundamental strength of a stock` },
        ],
        options: [
            { label: 'High IV Stocks', message: 'Which Indian stocks have high implied volatility suitable for options selling?' },
            { label: 'Options Strategy', message: 'Explain a good options strategy for a mildly bullish market' },
        ],
    };
    const interestActions = (interests || []).slice(0, 2).map(i => ({
        label: `${i} News`,
        message: `What's the latest news and outlook for the ${i} sector in India?`
    }));
    const quickActions = [
        ...baseQuickActions.slice(0, 2),
        ...(persona && personaQuickActions[persona] ? personaQuickActions[persona] : []),
        ...interestActions,
    ];


    return (
        <div className="flex flex-col h-full">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
                <AnimatePresence initial={false}>
                    {messages.map((message, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={cn(
                                'mb-4 flex',
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            <div
                                className={cn(
                                    'max-w-[80%] rounded-2xl px-4 py-3',
                                    message.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary text-secondary-foreground'
                                )}
                            >
                                <div className="flex items-start gap-2">
                                    {message.role === 'assistant' && (
                                        <Sparkles className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                                    )}
                                    <div>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                        <span className="text-xs opacity-60 mt-1 block">
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start mb-4"
                    >
                        <div className="bg-secondary rounded-2xl px-4 py-3">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                    </motion.div>
                )}
            </ScrollArea>

            {/* Quick Actions */}
            {messages.length === 1 && (
                <div className="px-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
                    <div className="flex flex-wrap gap-2">
                        {quickActions.map((action) => (
                            <Button
                                key={action.label}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    handleSend(action.message);
                                }}
                                className="text-xs"
                            >
                                {action.label}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything about the market..."
                        className="flex-1"
                        disabled={isLoading}
                    />

                    <Button
                        variant={ttsEnabled ? 'default' : 'outline'}
                        size="icon"
                        onClick={toggleSpeech}
                        title={ttsEnabled ? 'Voice enabled' : 'Voice disabled'}
                    >
                        {isSpeaking ? (
                            <Volume2 className="h-4 w-4 animate-pulse" />
                        ) : ttsEnabled ? (
                            <Volume2 className="h-4 w-4" />
                        ) : (
                            <VolumeX className="h-4 w-4" />
                        )}
                    </Button>

                    <Button
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                        size="icon"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
