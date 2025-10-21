export default async (req) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            console.error('API key not found on server.');
            return new Response(JSON.stringify({ error: 'API key not configured on the server.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        const { prompt, schema } = await req.json();

        if (!prompt || !schema) {
            return new Response(JSON.stringify({ error: 'Prompt and schema are required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

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
            return new Response(JSON.stringify({ error: `Gemini API call failed: ${errorBody}` }), { status: geminiResponse.status, headers: { 'Content-Type': 'application/json' } });
        }

        const data = await geminiResponse.json();
        
        return new Response(
            JSON.stringify(data),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*', // Or a specific domain
                }
            }
        );
    } catch (error) {
        console.error('Error in Netlify Function:', error);
        return new Response(JSON.stringify({ error: 'An error occurred while communicating with the Gemini API.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
