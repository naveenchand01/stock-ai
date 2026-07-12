const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testKey() {
    const key = "AIzaSyAhVowDATX5kM6REAvbcT8p3aCeFS8dkQg";
    console.log('Testing old key:', key);
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("hi");
        console.log('Old key gemini-1.5-flash OK:', result.response.text());
    } catch (e) {
        console.log('Old key FAILED:', e.message);
    }
}

testKey();
