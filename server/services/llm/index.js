const PROVIDERS = {
    gemini: () => require('./gemini'),
    anthropic: () => require('./anthropic'),
};

function getLLM(){
    const name = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
    const load = PROVIDERS[name];
    if (!load){
        throw new Error(
            `Unknown LLM_PROVIDER "${name}". Valid options: ${Object.keys(PROVIDERS).join(', ')}`
        );
    }
    return load();
}

module.exports = {
    getLLM,
};