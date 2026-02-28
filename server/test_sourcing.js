const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testSourcingSystem() {
    console.log('🚀 Testing AI Sourcing System...\n');

    try {
        // Step 1: Get a vacancy to create a campaign for
        console.log('1️⃣ Fetching vacancies...');
        const vacanciesRes = await axios.get(`${API_BASE}/vacantes`);
        const vacancy = vacanciesRes.data[0];

        if (!vacancy) {
            console.log('❌ No vacancies found. Please create a vacancy first.');
            return;
        }

        console.log(`✅ Found vacancy: ${vacancy.puesto_nombre} (ID: ${vacancy.id})\n`);

        // Step 2: Create a sourcing campaign
        console.log('2️⃣ Creating sourcing campaign...');
        const campaignRes = await axios.post(`${API_BASE}/sourcing/campaigns`, {
            vacante_id: vacancy.id,
            nombre: `Auto-Sourcing: ${vacancy.puesto_nombre}`,
            fuentes: ['linkedin', 'indeed', 'computrabajo', 'elempleo'],
            filtros: {
                ubicacion: 'Bogotá',
                experiencia_min: 2,
                skills: ['JavaScript', 'React', 'Node.js']
            },
            auto_run: false, // Manual for testing
            schedule: '0 */6 * * *'
        });

        const campaign = campaignRes.data;
        console.log(`✅ Campaign created: ${campaign.nombre} (ID: ${campaign.id})\n`);

        // Step 3: Run the campaign
        console.log('3️⃣ Running campaign (searching across job boards)...');
        console.log('⏳ This may take a few seconds...\n');

        const runRes = await axios.post(`${API_BASE}/sourcing/campaigns/${campaign.id}/run`);
        const results = runRes.data;

        console.log('✅ Campaign execution completed!\n');
        console.log('📊 RESULTS:');
        console.log(`   - Total candidates found: ${results.candidates_found}`);
        console.log(`   - Top candidates (score >= 70): ${results.top_candidates}`);
        console.log(`   - Average AI match score: ${results.avg_score}%\n`);

        // Step 4: Get top candidates
        console.log('4️⃣ Fetching top candidates...');
        const candidatesRes = await axios.get(`${API_BASE}/sourcing/campaigns/${campaign.id}/candidates`);
        const candidates = candidatesRes.data;

        console.log(`✅ Found ${candidates.length} candidates\n`);

        if (candidates.length > 0) {
            console.log('🌟 TOP 5 MATCHES:\n');
            candidates.slice(0, 5).forEach((candidate, index) => {
                console.log(`${index + 1}. ${candidate.nombre}`);
                console.log(`   📧 ${candidate.email}`);
                console.log(`   🎯 AI Match Score: ${Math.round(candidate.ai_match_score)}%`);
                console.log(`   🌐 Source: ${candidate.fuente}`);
                console.log(`   📍 Status: ${candidate.estado}\n`);
            });
        }

        // Step 5: Get analytics
        console.log('5️⃣ Fetching analytics...');
        const analyticsRes = await axios.get(`${API_BASE}/sourcing/analytics`);
        const analytics = analyticsRes.data;

        console.log('✅ Analytics Overview:');
        console.log(`   - Total campaigns: ${analytics.overview.total_campaigns}`);
        console.log(`   - Active campaigns: ${analytics.overview.active_campaigns}`);
        console.log(`   - Total candidates: ${analytics.overview.total_candidates}`);
        console.log(`   - Avg match score: ${analytics.overview.avg_match_score}%\n`);

        console.log('📈 Candidates by source:');
        analytics.by_source.forEach(source => {
            console.log(`   - ${source.fuente}: ${source.count} candidates (avg: ${Math.round(source.avg_score)}%)`);
        });

        console.log('\n🎉 AI Sourcing System Test Completed Successfully!');
        console.log('\n💡 Next steps:');
        console.log('   1. Open http://localhost:5173/sourcing in your browser');
        console.log('   2. View the Mission Control dashboard');
        console.log('   3. Explore candidates and run more campaigns');
        console.log('   4. Test the auto-scheduling feature\n');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testSourcingSystem();
