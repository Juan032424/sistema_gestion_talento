const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY || process.env.OPEN_AI_KEY;
    const genAI = new GoogleGenerativeAI(key);
    // Note: listModels is on the genAI instance or model? Check docs mental model.
    // Actually it's genAI.makeRequest usually but the SDK exposes it via model manager?
    // SDK doesn't expose listModels easily in the top level class in all versions.
    // Let's just try 'gemini-pro' in a test.
}

async function testPro() {
    console.log("Testing gemini-pro...");
    const key = process.env.GEMINI_API_KEY || process.env.OPEN_AI_KEY;
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("Response gemini-pro:", (await result.response).text());
        return true;
    } catch (e) {
        console.error("Error gemini-pro:", e.message);
        return false;
    }
}

async function testFlash() {
    console.log("Testing gemini-1.5-flash-latest...");
    const key = process.env.GEMINI_API_KEY || process.env.OPEN_AI_KEY;
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent("Hello");
        console.log("Response flast-latest:", (await result.response).text());
        return true;
    } catch (e) {
        console.error("Error flash-latest:", e.message);
        return false;
    }
}

(async () => {
    await testPro();
    await testFlash();
})();
