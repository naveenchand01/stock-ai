const https = require('https');
require('dotenv').config();

function getModels() {
    const key = process.env.GEMINI_API_KEY.trim();
    console.log('Using key:', key);
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                    console.error('API Error:', JSON.stringify(parsed.error, null, 2));
                    return;
                }
                if (parsed.models) {
                    console.log('Available Models:');
                    parsed.models.forEach(m => {
                        console.log(`- ${m.name} (supports: ${m.supportedGenerationMethods.join(', ')})`);
                    });
                } else {
                    console.log('No models returned. Full response:', data);
                }
            } catch (e) {
                console.error('Parse Error:', e.message);
                console.log('Raw data:', data);
            }
        });
    }).on('error', (err) => {
        console.error('HTTPS Error:', err.message);
    });
}

getModels();
