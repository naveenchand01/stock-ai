const https = require('https');
require('dotenv').config();

const key = process.env.GEMINI_API_KEY.trim();
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const parsed = JSON.parse(data);
        if (parsed.models) {
            console.log('--- MODELS START ---');
            parsed.models.forEach(m => console.log(m.name));
            console.log('--- MODELS END ---');
        } else {
            console.log('Error:', data);
        }
    });
});
