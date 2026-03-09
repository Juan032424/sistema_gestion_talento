const pool = require('../db');

/**
 * WorkplaceIntelligenceService - SHEYLA's Brain (Enhanced Fallback Mode)
 * Works with or without external AI - uses database intelligence
 */
class WorkplaceIntelligenceService {
    constructor() {
        this.name = 'SHEYLA Intelligence';
        // Try to load AI service, but don't fail if unavailable
        try {
            this.aiService = require('./aiService');
        } catch (e) {
            console.warn('[SHEYLA] AI Service not available, using rule-based responses');
            this.aiService = null;
        }
    }

    /**
     * Main entry point - Ask SHEYLA anything
     */
    async ask(question) {
        console.log(`[${this.name}] 💬 Question: "${question}"`);

        try {
            // 1. Gather relevant context from database
            const context = await this.gatherContext(question);

            // 2. Try AI first if available and we have a key
            if (this.aiService && this.aiService.apiKey) {
                try {
                    const systemPrompt = this.buildSystemPrompt();
                    const userPrompt = this.buildUserPrompt(question, context);
                    const response = await this.aiService.chat(systemPrompt, userPrompt, false);

                    // If AI gives a real answer (not error message), use it
                    if (!response.includes('dificultades técnicas')) {
                        console.log(`[${this.name}] ✅ AI response`);
                        return response;
                    }
                } catch (aiError) {
                    console.log(`[${this.name}] AI failed, using rule-based response`);
                }
            }

            // 3. Fallback to intelligent rule-based responses
            console.log(`[${this.name}] ✅ Rule-based response`);
            return this.generateIntelligentResponse(question, context);

        } catch (error) {
            console.error(`[${this.name}] ❌ Error:`, error);
            return this.getFallbackResponse(question);
        }
    }

    /**
     * Generate intelligent responses based on data without AI
     */
    generateIntelligentResponse(question, context) {
        const lowerQ = question.toLowerCase();

        // GREETING
        if (this.matchesKeywords(lowerQ, ['hola', 'hello', 'hi', 'buenos', 'buenas'])) {
            let greeting = "¡Hola! Soy SHEYLA, tu asistente inteligente de reclutamiento. 👋\n\n";

            if (context.metrics) {
                greeting += `📊 **Resumen del Sistema:**\n`;
                greeting += `• Vacantes Abiertas: **${context.metrics.vacantes_abiertas}**\n`;
                greeting += `• Vacantes Cubiertas: **${context.metrics.vacantes_cubiertas}**\n`;
                greeting += `• Candidatos Descubiertos: **${context.metrics.candidatos_totales}**\n`;
                if (context.metrics.score_promedio) {
                    greeting += `• Calidad Promedio: **${Math.round(context.metrics.score_promedio)}%**\n`;
                }
                greeting += `\n`;
            }

            greeting += `💡 **Puedo ayudarte con:**\n`;
            greeting += `• Ver vacantes abiertas o críticas\n`;
            greeting += `• Buscar los mejores candidatos\n`;
            greeting += `• Analizar fuentes de reclutamiento\n`;
            greeting += `• Recomendar estrategias de contratación\n`;
            greeting += `• Buscar candidatos en portales externos\n\n`;
            greeting += `¿En qué estás trabajando hoy?`;

            return greeting;
        }

        // VACANCIES
        if (this.matchesKeywords(lowerQ, ['vacant', 'puesto', 'posicion', 'trabajo', 'oferta', 'busca'])) {
            if (context.vacancies && context.vacancies.length > 0) {
                let response = `📋 **Vacantes Actuales:**\n\n`;

                context.vacancies.forEach((v, idx) => {
                    const status = v.estado === 'Abierta' ? '🟢' : '🔵';
                    const urgency = v.dias_abierta > 30 ? '🔴 CRÍTICA' : v.dias_abierta > 15 ? '🟡 Urgente' : '';
                    response += `${idx + 1}. ${status} **${v.puesto_nombre}**\n`;
                    response += `   Estado: ${v.estado} | ${v.dias_abierta} días abierta ${urgency}\n\n`;
                });

                if (context.metrics) {
                    response += `\n📊 Total: ${context.metrics.vacantes_abiertas} abiertas, ${context.metrics.vacantes_cubiertas} cubiertas`;
                }

                return response;
            }
            return "No encontré vacantes en este momento. ¿Quieres crear una nueva?";
        }

        // CANDIDATES
        if (this.matchesKeywords(lowerQ, ['candidato', 'perfil', 'postulante', 'talento', 'persona'])) {
            if (context.candidates && context.candidates.length > 0) {
                let response = `👥 **Candidatos Destacados:**\n\n`;

                context.candidates.slice(0, 5).forEach((c, idx) => {
                    const score = c.ai_match_score || 0;
                    const emoji = score > 85 ? '⭐' : score > 70 ? '✅' : '📌';
                    response += `${idx + 1}. ${emoji} **${c.nombre}**\n`;
                    response += `   ${c.titulo_actual || 'N/A'}\n`;
                    response += `   Match: ${Math.round(score)}% | Fuente: ${c.fuente}\n\n`;
                });

                return response;
            }
            return "Aún no hemos descubierto candidatos. Inicia una campaña de sourcing para encontrar talento.";
        }

        // SOURCES / PORTALS
        if (this.matchesKeywords(lowerQ, ['fuente', 'portal', 'linkedin', 'indeed', 'computrabajo', 'dónde', 'donde'])) {
            let response = `🔍 **Fuentes de Reclutamiento Disponibles:**\n\n`;

            response += `**Portales Principales:**\n`;
            response += `• LinkedIn - Red profesional líder\n`;
            response += `• Indeed - Gran volumen de candidatos\n`;
            response += `• Computrabajo - Popular en LATAM\n`;
            response += `• ElEmpleo.com - Especializado en Colombia\n`;
            response += `• Magneto - Perfiles diversos\n\n`;

            response += `**Redes Profesionales:**\n`;
            response += `• Get on Board - Tech y startups\n`;
            response += `• Ticjob - IT especializado\n\n`;

            response += `**Entidades Públicas:**\n`;
            response += `• SENA Agencia de Empleo\n`;
            response += `• Compensar, Cafam, Colsubsidio\n\n`;

            if (context.sources && context.sources.length > 0) {
                response += `**📊 Rendimiento de tus Fuentes:**\n`;
                context.sources.forEach(s => {
                    response += `• ${s.fuente}: ${s.total} candidatos (${Math.round(s.calidad)}% calidad)\n`;
                });
            }

            response += `\n💡 **Tip:** Usa múltiples fuentes para mejores resultados.`;
            return response;
        }

        // METRICS / STATS
        if (this.matchesKeywords(lowerQ, ['metrica', 'estadistica', 'dato', 'numero', 'cuanto', 'cuál', 'rendimiento'])) {
            if (context.metrics) {
                let response = `📊 **Métricas del Sistema:**\n\n`;
                response += `**Vacantes:**\n`;
                response += `• 🟢 Abiertas: ${context.metrics.vacantes_abiertas}\n`;
                response += `• ✅ Cubiertas: ${context.metrics.vacantes_cubiertas}\n`;
                response += `• 📈 Tasa de Éxito: ${Math.round((context.metrics.vacantes_cubiertas / (context.metrics.vacantes_abiertas + context.metrics.vacantes_cubiertas)) * 100)}%\n\n`;

                response += `**Candidatos:**\n`;
                response += `• Total Descubiertos: ${context.metrics.candidatos_totales}\n`;
                if (context.metrics.score_promedio) {
                    response += `• Calidad Promedio: ${Math.round(context.metrics.score_promedio)}%\n`;
                }

                return response;
            }
        }

        // RECOMMENDATIONS / STRATEGY
        if (this.matchesKeywords(lowerQ, ['recomend', 'suger', 'estrategia', 'mejor', 'optimiz', 'consejo'])) {
            let response = `💡 **Recomendaciones Estratégicas:**\n\n`;

            if (context.vacancies) {
                const critical = context.vacancies.filter(v => v.dias_abierta > 30);
                if (critical.length > 0) {
                    response += `🔴 **ATENCIÓN:** Tienes ${critical.length} vacante(s) crítica(s) (>30 días)\n\n`;
                    critical.forEach(v => {
                        response += `• **${v.puesto_nombre}** - ${v.dias_abierta} días\n`;
                        response += `  → Sugiero ampliar fuentes de búsqueda y revisar requisitos\n\n`;
                    });
                }
            }

            response += `**Mejores Prácticas:**\n`;
            response += `1. Usa 3-5 fuentes diferentes por vacante\n`;
            response += `2. Revisa candidatos dentro de las 48 horas\n`;
            response += `3. Mantén comunicación activa con prospects\n`;
            response += `4. Actualiza descripciones cada 15 días\n\n`;

            if (context.sources) {
                const best = context.sources[0];
                if (best) {
                    response += `✨ Tu mejor fuente actual es **${best.fuente}** (${Math.round(best.calidad)}% calidad)`;
                }
            }

            return response;
        }

        // GENERAL QUESTION
        return `Entiendo tu pregunta sobre "${question}".\n\n` +
            `Puedo ayudarte mejor si me preguntas sobre:\n` +
            `• Vacantes abiertas o críticas\n` +
            `• Candidatos disponibles\n` +
            `• Fuentes de reclutamiento\n` +
            `• Métricas y estadísticas\n` +
            `• Recomendaciones estratégicas\n\n` +
            `¿Qué te gustaría saber específicamente?`;
    }

    /**
     * Get strategic recommendations
     */
    async getSearchOptimizationRecommendations() {
        try {
            const [openVacancies] = await pool.query(`
                SELECT id, puesto_nombre, fecha_creacion, estado,
                       DATEDIFF(NOW(), fecha_creacion) as dias_abierta
                FROM vacantes 
                WHERE estado = 'Abierta'
                ORDER BY fecha_creacion ASC
                LIMIT 10
            `);

            const recommendations = [];

            openVacancies.forEach(v => {
                if (v.dias_abierta > 30) {
                    recommendations.push({
                        vacancy_id: v.id,
                        vacancy_name: v.puesto_nombre,
                        issue: `${v.dias_abierta} días abierta - CRÍTICA`,
                        action: `Ampliar búsqueda a LinkedIn, Indeed y Computrabajo. Revisar salario y requisitos.`,
                        expected_impact: `Reducción de 10-15 días`
                    });
                } else if (v.dias_abierta > 15) {
                    recommendations.push({
                        vacancy_id: v.id,
                        vacancy_name: v.puesto_nombre,
                        issue: `${v.dias_abierta} días abierta - Moderada urgencia`,
                        action: `Activar sourcing en 2-3 portales adicionales. Considerar referidos.`,
                        expected_impact: `Reducción de 5-7 días`
                    });
                }
            });

            if (recommendations.length === 0) {
                recommendations.push({
                    vacancy_id: 0,
                    vacancy_name: "Estado general bueno",
                    issue: "Sin vacantes críticas detectadas",
                    action: "Mantener estrategia actual. Continuar sourcing activo.",
                    expected_impact: "Mantener eficiencia"
                });
            }

            return {
                recommendations,
                general_strategy: "Priorizar vacantes con más de 30 días. Diversificar fuentes de reclutamiento. Mantener pipeline activo."
            };

        } catch (error) {
            console.error('Error generating recommendations:', error);
            return {
                recommendations: [
                    {
                        vacancy_id: 0,
                        vacancy_name: "Sistema",
                        issue: "Datos no disponibles",
                        action: "Verifica la conexión a la base de datos",
                        expected_impact: "N/A"
                    }
                ],
                general_strategy: "Enfócate en las vacantes más antiguas y diversifica las fuentes de búsqueda."
            };
        }
    }

    /**
     * Gather context from database
     */
    async gatherContext(question) {
        const lowerQ = question.toLowerCase();
        const context = { query: question };

        try {
            // Always get metrics
            const [stats] = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM vacantes WHERE estado = 'Abierta') as vacantes_abiertas,
                    (SELECT COUNT(*) FROM vacantes WHERE estado = 'Cubierta') as vacantes_cubiertas,
                    (SELECT COUNT(*) FROM sourced_candidates) as candidatos_totales,
                    (SELECT AVG(ai_match_score) FROM sourced_candidates) as score_promedio
            `);
            context.metrics = stats[0];

            // Vacancies if relevant
            if (this.matchesKeywords(lowerQ, ['vacant', 'puesto', 'posicion', 'trabajo', 'oferta', 'publica', 'visibilidad'])) {
                const [vacancies] = await pool.query(`
                    SELECT id, puesto_nombre, estado, fecha_creacion, visibilidad_publica,
                           DATEDIFF(NOW(), fecha_creacion) as dias_abierta
                    FROM vacantes 
                    ORDER BY fecha_creacion DESC 
                    LIMIT 10
                `);
                context.vacancies = vacancies;
            }

            // Candidates if relevant
            if (this.matchesKeywords(lowerQ, ['candidato', 'perfil', 'postulante', 'talento', 'contrat', 'vincul'])) {
                const [candidates] = await pool.query(`
                    SELECT nombre, titulo_actual, ai_match_score, fuente, etapa
                    FROM sourced_candidates
                    ORDER BY ai_match_score DESC
                    LIMIT 10
                `);
                context.candidates = candidates;
            }

            // Sources if relevant
            if (this.matchesKeywords(lowerQ, ['fuente', 'portal', 'linkedin', 'indeed', 'dónde', 'donde'])) {
                const [sources] = await pool.query(`
                    SELECT fuente, COUNT(*) as total, AVG(ai_match_score) as calidad
                    FROM sourced_candidates
                    GROUP BY fuente
                    ORDER BY calidad DESC
                `);
                context.sources = sources;
            }

        } catch (error) {
            console.error('[Context] Error:', error);
        }

        return context;
    }

    buildSystemPrompt() {
        return `Eres SHEYLA (Sistema Humano de Estrategia y Logística Avanzada), la inteligencia artificial central de GH-SCORE 360 para DISCOL S.A.S.

Tu objetivo es asistir a los reclutadores en la gestión estratégica del talento. Tienes conocimiento profundo de cómo funciona este sistema:

CONOCIMIENTO DEL SISTEMA GH-SCORE 360:
1. PROPÓSITO: Centralizar requisiciones, automatizar métricas de cumplimiento (SLA) y mejorar el matching de perfiles mediante IA.
2. MÓDULOS:
   - Dashboard: Visualiza KPIs como Lead Time, Eficiencia SLA y "Costo de Vacante" (Impacto económico por retraso).
   - Vacantes: Gestión de requisiciones con control de semáforos (Verde/Ámbar/Rojo) según el SLA meta.
   - Candidatos: Seguimiento del funnel desde postulación hasta contratación (90 días de permanencia).
   - Kanban: Gestión visual de etapas de selección.
   - Portal Público: Sitio "Aerospace Design" donde candidatos externos se postulan.
3. REGLAS CLAVE:
   - Costo Vacante: Se calcula como [Salario Diario × Días Retraso × 1.5]. Representa la pérdida por no tener el puesto cubierto.
   - SLA: Si una vacante se reabre, el sistema reinicia automáticamente el conteo de días.
   - Publicación: Para que una vacante aparezca en el portal externo, debe tener activada la "Visibilidad Pública".
4. OPERACIONES FRECUENTES:
   - ¿Cómo cubrir vacante?: Primero marcar al candidato como "Contratado" en el módulo de candidatos o Kanban, luego ir a la Vacante, cambiar estado a "Cubierta" y definir la "Fecha de Cierre Real".
   - ¿Cómo publicar?: Activar el switch de "Visibilidad Pública" en el detalle de la vacante.

DATOS EN TIEMPO REAL:
Se te proporcionarán métricas y datos actuales del sistema en el contexto del usuario. Úsalos para dar respuestas precisas.

TONO: Profesional, ejecutivo, proactivo y muy servicial. Responde siempre en español de Colombia/Latinoamérica.`;
    }

    buildUserPrompt(question, context) {
        let prompt = `ESTADO ACTUAL DEL SISTEMA:\n`;
        if (context.metrics) {
            prompt += `- Vacantes: ${context.metrics.vacantes_abiertas} abiertas, ${context.metrics.vacantes_cubiertas} cubiertas.\n`;
            prompt += `- Candidatos: ${context.metrics.candidatos_totales} en base de datos.\n`;
            prompt += `- Calidad Match Promedio: ${Math.round(context.metrics.score_promedio || 0)}%.\n`;
        }

        if (context.vacancies && context.vacancies.length > 0) {
            prompt += `\nLISTA DE VACANTES RECIENTES:\n`;
            context.vacancies.slice(0, 5).forEach(v => {
                prompt += `- ${v.puesto_nombre} (${v.estado}, ${v.dias_abierta} días, Pública: ${v.visibilidad_publica ? 'Sí' : 'No'})\n`;
            });
        }

        prompt += `\nPREGUNTA DEL USUARIO: "${question}"\n\nResponde basándote en el conocimiento del sistema y los datos proporcionados.`;
        return prompt;
    }

    matchesKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }

    getFallbackResponse(question) {
        return "¡Hola! Soy SHEYLA. Estoy teniendo un momento de desconexión con mis módulos cerebrales, pero puedo decirte que el sistema GH-SCORE 360 está operativo. ¿En qué puedo ayudarte manualmente?";
    }
}

module.exports = new WorkplaceIntelligenceService();
