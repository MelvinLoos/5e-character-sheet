const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            return { statusCode: 500, body: JSON.stringify({ error: 'API key not found on server.' }) };
        }

        const { prompt, schema } = JSON.parse(event.body);

        if (!prompt || !schema) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Prompt and schema are required.' }) };
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

        const systemInstruction = "You are an expert Dungeons & Dragons 5e 2024 ruleset Game Master. The user will provide a prompt describing a character. You will generate a complete, rules-legal character sheet in JSON format that adheres to the provided schema. Ensure the character is interesting and the choices are thematically appropriate to the prompt. Base all rules on the 2024 Player's Handbook.";

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        };

        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error('Gemini API Error:', errorBody);
            return { statusCode: geminiResponse.status, body: JSON.stringify({ error: `Gemini API call failed: ${errorBody}` }) };
        }

        const data = await geminiResponse.json();
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Or lock down to your domain
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Error in Netlify Function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An error occurred while communicating with the Gemini API.' })
        };
    }
};
