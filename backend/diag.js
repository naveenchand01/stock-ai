const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function findWorkingModel() {
    const key = process.env.GEMINI_API_KEY.trim();
    console.log('Using trimmed key:', key.substring(0, 10) + '...');
    const genAI = new GoogleGenerativeAI(key);

    // Most likely to work models
    const models = [
        'gemini-1.5-flash',
        'gemini-2.0-flash',
        'gemini-flash-latest',
        'gemini-1.5-pro',
        'gemini-pro-latest',
        'gemini-2.0-flash-lite',
        'gemini-1.0-pro'
    ];

    for (const m of models) {
        process.stdout.write(`Testing ${m}... `);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("hi");
            const txt = result.response.text();
            console.log(`SUCCESS! Response: ${txt.substring(0, 20)}`);
            // Stop at first working one
            return m;
        } catch (e) {
            console.log(`FAILED: ${e.message.substring(0, 50)}...`);
        }
    }
    console.log("No models worked.");
    return null;
}

findWorkingModel();
