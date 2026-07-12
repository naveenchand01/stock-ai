const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testSDK() {
    const key = process.env.GEMINI_API_KEY.trim();
    console.log('Key:', key.substring(0, 10));
    const genAI = new GoogleGenerativeAI(key);

    // Explicit list from your list_models script
    const models = [
        'gemini-flash-latest',
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'gemini-3-flash-preview',
        'gemini-3-pro-preview'
    ];

    for (const m of models) {
        console.log(`Testing with SDK model: ${m}`);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Respond with OK");
            console.log(`Model ${m} SUCCESS: ${result.response.text()}`);
            return;
        } catch (e) {
            console.log(`Model ${m} SDK ERROR:`, e.message);
        }
    }
}

testSDK();
