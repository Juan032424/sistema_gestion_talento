// Quick test of the AI service
const dotenv = require('dotenv');
dotenv.config();

console.log("=== AI SERVICE TEST ===");
console.log("API Key present:", !!process.env.GEMINI_API_KEY);
console.log("API Key length:", process.env.GEMINI_API_KEY?.length || 0);

const aiService = require('./services/aiService');

async function testBasic() {
    console.log("\n[TEST 1] Basic hello test...");
    try {
        const result = await aiService.chat(
            "You are a helpful assistant",
            "Say hello in Spanish",
            false
        );
        console.log("✅ Result:", result);
        return true;
    } catch (e) {
        console.error("❌ Error:", e.message);
        return false;
    }
}

async function testWorkplaceIntelligence() {
    console.log("\n[TEST 2] WorkplaceIntelligence test...");
    try {
        const wi = require('./services/WorkplaceIntelligence');
        const result = await wi.ask("hola");
        console.log("✅ Result:", result.substring(0, 200) + "...");
        return true;
    } catch (e) {
        console.error("❌ Error:", e.message);
        return false;
    }
}

async function runTests() {
    const test1 = await testBasic();
    const test2 = await testWorkplaceIntelligence();

    console.log("\n=== RESULTS ===");
    console.log("Basic AI:", test1 ? "✅ PASS" : "❌ FAIL");
    console.log("Intelligence:", test2 ? "✅ PASS" : "❌ FAIL");

    process.exit((test1 && test2) ? 0 : 1);
}

runTests();
