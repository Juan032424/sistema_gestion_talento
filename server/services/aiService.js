const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

// Initialize Gemini with API key
const apiKey = process.env.GEMINI_API_KEY || process.env.OPEN_AI_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

class AIService {
    constructor() {
        this.apiKey = apiKey;
        this.defaultModel = "gemini-pro-latest"; // Use latest stable pro model
    }

    async chat(systemPrompt, userPrompt, jsonMode = false) {
        // If no API key, return mock
        if (!this.apiKey || !genAI) {
            console.warn("⚠️ No API Key - Using mock response");
            return jsonMode
                ? { answer: "Servicio de IA no configurado. Por favor configura GEMINI_API_KEY." }
                : "Hola! Soy SHEYLA en modo local. La IA aún no está configurada, pero puedo ayudarte con información básica del sistema.";
        }

        try {
            console.log(`[AI Service] Using model: ${this.defaultModel}`);

            // Build model config - SIMPLE approach
            const modelConfig = {
                model: this.defaultModel
            };

            // Add system instruction if supported
            if (systemPrompt) {
                modelConfig.systemInstruction = systemPrompt;
            }

            // Add JSON mode if requested
            if (jsonMode) {
                modelConfig.generationConfig = {
                    responseMimeType: "application/json",
                    temperature: 0.7
                };
            }

            const model = genAI.getGenerativeModel(modelConfig);

            // Generate content
            const result = await model.generateContent(userPrompt);
            const response = await result.response;
            const text = response.text();

            console.log(`[AI Service] ✅ Response received (${text.length} chars)`);

            return jsonMode ? JSON.parse(text) : text;

        } catch (error) {
            console.error("❌ [AI Service] Error:", error.message);

            // Try fallback to basic model without extras
            try {
                console.log("[AI Service] Attempting fallback...");
                const basicModel = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
                const combinedPrompt = systemPrompt
                    ? `${systemPrompt}\n\nUser: ${userPrompt}`
                    : userPrompt;

                const result = await basicModel.generateContent(combinedPrompt);
                const text = (await result.response).text();

                console.log("[AI Service] ✅ Fallback succeeded");

                if (jsonMode) {
                    // Try to extract JSON from text
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[0]);
                    }
                    return { answer: text };
                }
                return text;
            } catch (fallbackError) {
                console.error("❌ [AI Service] Fallback also failed:", fallbackError.message);

                // Return helpful error message
                const errorMsg = "Estoy teniendo dificultades técnicas temporales. Por favor intenta de nuevo en un momento.";
                return jsonMode ? { error: errorMsg } : errorMsg;
            }
        }
    }

    async analyzeCV(cvText, jobDescription) {
        if (!this.apiKey) {
            return {
                score: 75,
                summary: "Análisis simulado: Candidato con experiencia relevante."
            };
        }

        const prompt = `Analiza este CV contra la descripción del puesto y responde en JSON con:
{
  "score": número del 0 al 100,
  "summary": "resumen breve"
}

CV: ${cvText}
Puesto: ${jobDescription}`;

        try {
            const model = genAI.getGenerativeModel({
                model: this.defaultModel,
                generationConfig: { responseMimeType: "application/json" }
            });

            const result = await model.generateContent(prompt);
            const text = (await result.response).text();
            return JSON.parse(text);
        } catch (error) {
            console.error("Error analyzing CV:", error);
            return {
                score: 70,
                summary: "Error en análisis automático. Requiere revisión manual."
            };
        }
    }

    async match(cvText, jobDescription) {
        return this.analyzeCV(cvText, jobDescription);
    }

    async transcribeAudio(audioBuffer) {
        return "Transcripción de audio no disponible en esta versión.";
    }

    async analyzeSentiment(text) {
        return "Neutral";
    }

    async analyzeBehavior(logs) {
        if (!this.apiKey || !genAI) {
            return {
                summary: "Modo Local: El candidato muestra un patrón de búsqueda activo con interés recurrente en cargos técnicos. Nivel de interés: Alto.",
                engagement_level: "High",
                key_patterns: ["Búsqueda nocturna", "Interés en remoto"],
                recommendation: "Contactar de inmediato para entrevista técnica."
            };
        }

        const logsText = logs.map(l => `[${l.created_at}] ${l.activity_type}: ${l.description}`).join('\n');

        const systemPrompt = "Eres un experto en psicología aplicada al reclutamiento y analista de datos de HR. Tu objetivo es analizar el comportamiento de un candidato en un portal de empleo y predecir su nivel de interés y fit cultural.";

        const userPrompt = `Analiza los siguientes logs de actividad de un candidato y genera un informe estratégico en formato JSON con la siguiente estructura:
{
  "summary": "resumen ejecutivo del comportamiento",
  "engagement_level": "Low/Medium/High",
  "key_patterns": ["patrón 1", "patrón 2"],
  "recommendation": "acción sugerida para el reclutador"
}

LOGS DE ACTIVIDAD:
${logsText}`;

        try {
            return await this.chat(systemPrompt, userPrompt, true);
        } catch (error) {
            console.error("Error in AI analyzeBehavior:", error);
            return {
                summary: "Error al generar el análisis. Los logs indican actividad reciente en el portal.",
                engagement_level: "Unknown",
                key_patterns: [],
                recommendation: "Revisar logs manualmente."
            };
        }
    }
}

module.exports = new AIService();
