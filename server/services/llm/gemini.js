const { GoogleGenAI } = require('@google/genai');

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function chat(system, user){
    const response = await client.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: user,
        config:{
            systemInstruction: system,
            maxOutputTokens: 300,
            responseMimeType: 'application/json',  // force valid JSON, no prose/fences
            thinkingConfig: { thinkingBudget: 0 }, // turn off "thinking" for this simple task
        },
    });
    return response.text;
}

module.exports = {
    chat,
};