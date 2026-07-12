import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './src/config/env';

async function main() {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const res = await model.generateContent('Hi');
        console.log("Response:", res.response.text());
    } catch (e: any) {
        console.log("Error with gemini-1.5-flash:", e.message);

        try {
            const model2 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
            const res2 = await model2.generateContent('Hi');
            console.log("Response for latest:", res2.response.text());
        } catch (e2: any) {
            console.log("Error with gemini-1.5-flash-latest:", e2.message);
        }
    }
}

main().catch(console.error);
