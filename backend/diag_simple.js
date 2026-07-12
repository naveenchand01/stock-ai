const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function findWorkingModel() {
    const key = process.env.GEMINI_API_KEY.trim();
    console.log('Using trimmed key:', key.substring(0, 10) + '...');
    const genAI = new GoogleGenerativeAI(key);

    const models = [
        'gemini-1.5-flash',
        'gemini-2.0-flash',
        'gemini-flash-latest',
        'gemini-1.5-pro'
    ];

    for (const m of models) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("hi");
            console.log(`SUCCESS: ${m}`);
            return;
        } catch (e) {
            console.log(`FAILED: ${m} - ${e.message}`);
        }
    }
}

findWorkingModel();
