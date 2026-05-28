const Anthropic = require('@anthropic-ai/sdk').default;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function chat(system, user){
    const response = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: system,
        messages: [{ role: 'user', content: user }],
    });

    return response.content[0].text;
}

module.exports = {
    chat,
};