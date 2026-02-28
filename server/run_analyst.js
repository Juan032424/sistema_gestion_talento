const analystAgent = require('./agents/analystAgent');
const dotenv = require('dotenv');

dotenv.config();

async function runAnalyst() {
    console.log('--- MANUALLY TRIGGERING ANALYST AGENT ---');
    await analystAgent.calculateVacancyCosts();
    console.log('--- ANALYSIS COMPLETE ---');
    process.exit(0);
}

runAnalyst();
