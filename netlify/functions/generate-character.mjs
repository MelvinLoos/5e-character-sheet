import fetch from 'node-fetch';

export default async (req, context) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const GEMINI_API_KEY = Netlify.env.get('GEMINI_API_KEY');

        if (!GEMINI_API_KEY) {
            return Response.error('API key not found on server.');
        }

        const { prompt, schema } = JSON.parse(req.body);

        if (!prompt || !schema) {
            return Response.error('Prompt and schema are required.');
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
            return Response.error({ statusCode: geminiResponse.status, body: JSON.stringify({ error: `Gemini API call failed: ${errorBody}` }) });
        }

        const data = await geminiResponse.json();
        
        const domain = Netlify.env.get('DOMAIN') || '*';
        return new Response(
            JSON.stringify(data),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': domain,
                }
            }
        );
    } catch (error) {
        console.error('Error in Netlify Function:', error);
        return Response.error('An error occurred while communicating with the Gemini API.', { status: 500 });
    }
};
