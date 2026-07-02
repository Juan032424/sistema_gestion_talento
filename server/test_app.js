const applicationService = require('./services/ApplicationService');

async function main() {
    try {
        const apps = await applicationService.getApplicationsByVacancy(775, {});
        console.log("Success! Extracted apps:", apps.length);
        if (apps.length > 0) {
            console.log("Sample:", {
                id: apps[0].id,
                vacancy: apps[0].puesto_nombre,
                candidate: apps[0].candidato_nombre_interno
            });
        }
    } catch(err) {
        console.error("Failed to extract applications:", err);
    }
    process.exit(0);
}

main();
