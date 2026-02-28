const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

async function test() {
    console.log("Testing Gemini API...");
    const key = process.env.GEMINI_API_KEY || process.env.OPEN_AI_KEY;
    console.log("Key available:", !!key, "Length:", key ? key.length : 0);

    if (!key) {
        console.error("No key found");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log("Sending prompt...");
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log("Response:", response.text());
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
