const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testV25() {
    const key = process.env.GEMINI_API_KEY.trim();
    console.log('Using key:', key.substring(0, 10) + '...');
    try {
        const genAI = new GoogleGenerativeAI(key);
        // Using explicitly supported models from list_models.js output
        const modelsToTry = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];

        for (const m of modelsToTry) {
            console.log(`Trying model: ${m}`);
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("Respond with 'OK'");
                console.log(`Model ${m} SUCCESS:`, result.response.text());
                return;
            } catch (e) {
                console.log(`Model ${m} FAILED:`, e.message);
            }
        }
    } catch (error) {
        console.error('Fatal Script Error:', error.message);
    }
}

testV25();
