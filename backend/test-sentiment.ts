import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './src/config/env';

async function main() {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analyze the underlying market sentiment for the following financial news headlines.
Respond with ONLY a raw JSON array (no markdown, no backticks, no explanation).
Array MUST have exactly 3 elements, corresponding 1-to-1 to the headlines below.
Each element: {"sentiment": <float between -1.0 and 1.0>}
-1.0 = extremely bearish/negative, 0.0 = neutral, 1.0 = extremely bullish/positive.

Headlines:
1. Reliance Industries posts record quarterly profit
2. Market crash fears grow as inflation rises
3. Tech stocks remain flat amid global uncertainty`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    console.log("=== RAW RESPONSE ===");
    console.log(JSON.stringify(text));
    console.log("=== END ===");

    // Try parsing
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    console.log("=== CLEANED ===");
    console.log(cleaned);

    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
        const parsed = JSON.parse(match[0]);
        console.log("=== PARSED ===");
        console.log(parsed);
    } else {
        console.log("NO MATCH FOUND");
    }
}

main().catch(console.error);
