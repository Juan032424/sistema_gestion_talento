const aiService = require('./aiService');

/**
 * AIMatchingEngine - Semantic candidate matching using GPT-4o
 * Provides intelligent scoring beyond simple keyword matching
 */
class AIMatchingEngine {
    constructor() {
        this.name = 'AI Matching Engine';
        this.cache = new Map();
    }

    /**
     * Score a candidate against job requirements using semantic analysis
     */
    async scoreCandidate(candidateProfile, jobRequirements) {
        console.log(`[${this.name}] Analyzing candidate fit...`);

        // Check cache first
        const cacheKey = this.getCacheKey(candidateProfile, jobRequirements);
        if (this.cache.has(cacheKey)) {
            console.log(`[${this.name}] Cache hit!`);
            return this.cache.get(cacheKey);
        }

        try {
            const analysis = await this.performSemanticAnalysis(candidateProfile, jobRequirements);
            const result = { ...candidateProfile, ...analysis };

            // Cache the result
            this.cache.set(cacheKey, result);

            return result;
        } catch (error) {
            console.error(`[${this.name}] Error:`, error.message);
            // Fallback to basic scoring
            return this.basicScoring(candidateProfile, jobRequirements);
        }
    }

    /**
     * Perform semantic analysis using GPT-4o
     */
    async performSemanticAnalysis(candidate, jobReq) {
        const prompt = `Eres un experto reclutador de tecnología. Analiza qué tan bien encaja este candidato para el puesto.

**CANDIDATO:**
- Nombre: ${candidate.nombre}
- Título Actual: ${candidate.titulo_actual || 'N/A'}
- Empresa: ${candidate.empresa_actual || 'N/A'}
- Experiencia: ${candidate.experiencia_anos || 0} años
- Skills: ${(candidate.skills || []).join(', ')}
- Educación: ${candidate.educacion || 'N/A'}
- Ubicación: ${candidate.ubicacion || 'N/A'}

**REQUISITOS DEL PUESTO:**
${jobReq.descripcion || jobReq}

**INSTRUCCIONES:**
Proporciona un análisis en formato JSON con:
1. score: número del 0-100 (qué tan bien encaja)
2. strengths: array de 3 fortalezas principales del candidato para este rol
3. gaps: array de 2-3 brechas o áreas de mejora
4. recommendation: string con recomendación clara (Highly Recommended / Recommended / Consider / Not Recommended)
5. reasoning: string breve explicando el score
6. interview_questions: array de 3 preguntas clave para la entrevista

Sé preciso y objetivo. Considera skills transferibles y potencial de crecimiento.`;

        const response = await aiService.analyzeCV(prompt, '');

        return {
            ...response,
            candidate_name: candidate.nombre,
            analyzed_at: new Date(),
            engine_version: '3.0'
        };
    }

    /**
     * Batch score multiple candidates
     */
    async scoreCandidates(candidates, jobRequirements) {
        console.log(`[${this.name}] Batch scoring ${candidates.length} candidates...`);

        const scoringPromises = candidates.map(candidate =>
            this.scoreCandidate(candidate, jobRequirements)
        );

        const results = await Promise.all(scoringPromises);

        // Sort by score descending
        return results.sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    /**
     * Fallback basic scoring when AI is unavailable
     */
    basicScoring(candidate, jobReq) {
        let score = 50; // Base score

        // Check skills overlap
        const reqSkills = this.extractSkills(jobReq.descripcion || jobReq);
        const candidateSkills = candidate.skills || [];

        const matchingSkills = candidateSkills.filter(skill =>
            reqSkills.some(reqSkill =>
                skill.toLowerCase().includes(reqSkill.toLowerCase()) ||
                reqSkill.toLowerCase().includes(skill.toLowerCase())
            )
        );

        score += Math.min(matchingSkills.length * 10, 30);

        // Experience bonus
        const reqYears = this.extractYearsExperience(jobReq.descripcion || jobReq);
        if (candidate.experiencia_anos >= reqYears) {
            score += 15;
        } else if (candidate.experiencia_anos >= reqYears * 0.7) {
            score += 10;
        }

        // Location match
        if (jobReq.ubicacion && candidate.ubicacion === jobReq.ubicacion) {
            score += 5;
        }

        return {
            ...candidate,
            score: Math.min(score, 100),
            strengths: matchingSkills.slice(0, 3).map(s => `Experiencia en ${s}`),
            gaps: ['Análisis detallado no disponible (modo offline)'],
            recommendation: score >= 75 ? 'Recommended' : score >= 60 ? 'Consider' : 'Not Recommended',
            reasoning: 'Scoring basado en coincidencia de skills y experiencia',
            interview_questions: [
                '¿Puedes describir tu experiencia más relevante para este rol?',
                '¿Qué te motiva a aplicar a esta posición?',
                '¿Cuáles son tus expectativas salariales?'
            ],
            analyzed_at: new Date(),
            engine_version: '3.0-basic'
        };
    }

    /**
     * Extract skills from job description
     */
    extractSkills(text) {
        const commonSkills = [
            'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'AWS',
            'Docker', 'Kubernetes', 'Git', 'Agile', 'Scrum', 'TypeScript',
            'Angular', 'Vue', 'MongoDB', 'PostgreSQL', 'Redis', 'GraphQL'
        ];

        return commonSkills.filter(skill =>
            text.toLowerCase().includes(skill.toLowerCase())
        );
    }

    /**
     * Extract years of experience from job description
     */
    extractYearsExperience(text) {
        const match = text.match(/(\d+)\+?\s*(años?|years?)/i);
        return match ? parseInt(match[1]) : 3; // Default 3 years
    }

    /**
     * Generate cache key
     */
    getCacheKey(candidate, jobReq) {
        const candidateKey = `${candidate.email}-${candidate.skills?.join(',')}`;
        const jobKey = typeof jobReq === 'string' ? jobReq.substring(0, 100) : jobReq.id;
        return `${candidateKey}-${jobKey}`;
    }

    /**
     * Predict hiring success based on historical data
     */
    async predictHiringSuccess(candidate, vacancy, historicalData = []) {
        // Simplified prediction - in production would use ML model
        const score = await this.scoreCandidate(candidate, vacancy);

        let probability = score.score / 100;

        // Adjust based on source reliability (if we have historical data)
        const sourceMultiplier = {
            'linkedin': 1.1,
            'indeed': 1.0,
            'computrabajo': 0.95,
            'elempleo': 0.9,
            'magneto': 0.85
        };

        probability *= (sourceMultiplier[candidate.fuente] || 1.0);
        probability = Math.min(probability, 0.95); // Cap at 95%

        // Estimate time to hire based on score
        let estimatedDays = 30;
        if (score.score >= 85) estimatedDays = 14;
        else if (score.score >= 75) estimatedDays = 21;
        else if (score.score >= 65) estimatedDays = 28;

        return {
            probability: Math.round(probability * 100) / 100,
            estimated_time_to_hire: `${estimatedDays} días`,
            confidence: score.score >= 75 ? 0.85 : 0.70,
            risk_factors: score.gaps || [],
            success_factors: score.strengths || []
        };
    }

    /**
     * Generate personalized outreach message
     */
    async generateOutreachMessage(candidate, vacancy) {
        const prompt = `Genera un mensaje de outreach profesional y personalizado para contactar a este candidato.

**CANDIDATO:**
- Nombre: ${candidate.nombre}
- Título: ${candidate.titulo_actual}
- Empresa: ${candidate.empresa_actual}

**VACANTE:**
- Puesto: ${vacancy.puesto_nombre}
- Empresa: DISCOL SAS

**INSTRUCCIONES:**
Crea un mensaje corto (máximo 150 palabras) que:
1. Sea personalizado y mencione algo específico del perfil del candidato
2. Presente la oportunidad de forma atractiva
3. Incluya un call-to-action claro
4. Tenga un tono profesional pero cercano

Formato JSON:
{
    "subject": "asunto del email",
    "body": "cuerpo del mensaje",
    "tone": "professional/casual",
    "personalization_score": 0-100
}`;

        try {
            const response = await aiService.analyzeCV(prompt, '');
            return response;
        } catch (error) {
            // Fallback template
            return {
                subject: `Oportunidad: ${vacancy.puesto_nombre} en DISCOL SAS`,
                body: `Hola ${candidate.nombre.split(' ')[0]},\n\nVi tu perfil y me impresionó tu experiencia en ${candidate.titulo_actual}. Tenemos una oportunidad como ${vacancy.puesto_nombre} que creo que podría interesarte.\n\n¿Estarías disponible para una breve conversación esta semana?\n\nSaludos,\nEquipo de Reclutamiento DISCOL SAS`,
                tone: 'professional',
                personalization_score: 60
            };
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log(`[${this.name}] Cache cleared`);
    }
}

module.exports = new AIMatchingEngine();
