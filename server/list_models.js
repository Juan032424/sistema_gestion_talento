const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function list() {
    const key = process.env.GEMINI_API_KEY || process.env.OPEN_AI_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    try {
        const res = await axios.get(url);
        console.log("Models:", res.data.models.map(m => m.name));
    } catch (e) {
        console.error("Error listing:", e.response ? e.response.data : e.message);
    }
}
list();
