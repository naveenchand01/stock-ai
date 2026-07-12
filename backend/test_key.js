const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listAllModels() {
    const key = process.env.GEMINI_API_KEY;
    console.log('Testing key starting with:', key ? key.substring(0, 10) : 'none');
    try {
        const genAI = new GoogleGenerativeAI(key);
        // Sometimes there's no direct listModels but we can try common ones
        const commonModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];
        for (const m of commonModels) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("hi");
                console.log(`Model ${m} OK:`, result.response.text().substring(0, 20));
            } catch (e) {
                console.log(`Model ${m} FAILED:`, e.message);
            }
        }
    } catch (error) {
        console.error('Core error:', error.message);
    }
}

listAllModels();
