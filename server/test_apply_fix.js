const pool = require('./db');
const applicationService = require('./services/ApplicationService');

async function testApply() {
    try {
        console.log('Testing job application...');

        // Use an existing vacancy ID (e.g., 3 from previous check)
        const vacancyId = 3;
        const candidateData = {
            nombre: 'Test Candidate ' + Date.now(),
            email: 'test' + Date.now() + '@example.com',
            telefono: '555-1234',
            titulo_profesional: 'Software Engineer',
            experiencia_anos: 5,
            salario_esperado: 5000000,
            disponibilidad: 'Inmediata',
            carta_presentacion: 'I am interested in this position.',
            cv_url: 'http://example.com/cv.pdf'
        };

        const result = await applicationService.applyToJob(vacancyId, candidateData);
        console.log('✅ Application successful:', result);

    } catch (error) {
        console.error('❌ Application failed:', error);
    } finally {
        process.exit(0);
    }
}

testApply();
