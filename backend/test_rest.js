const https = require('https');
require('dotenv').config();

async function testRest() {
    const key = process.env.GEMINI_API_KEY.trim();
    // Using gemini-flash-latest which is in the user's key's available list
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`;
    const postData = JSON.stringify({
        contents: [{ parts: [{ text: "hi" }] }]
    });

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };

    console.log('Requesting generateContent via REST with gemini-flash-latest...');
    const req = https.request(url, options, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
            console.log(`Status: ${res.statusCode}`);
            try {
                const parsed = JSON.parse(body);
                if (parsed.error) {
                    console.log('Error:', parsed.error.message);
                } else if (parsed.candidates) {
                    console.log('SUCCESS! Output:', parsed.candidates[0].content.parts[0].text);
                } else {
                    console.log('Other:', body);
                }
            } catch (e) {
                console.log('Body:', body);
            }
        });
    });

    req.write(postData);
    req.end();
}

testRest();
