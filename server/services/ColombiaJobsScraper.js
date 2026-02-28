/**
 * ColombiaJobsScraper.js — v2
 * 
 * Servicio de búsqueda de candidatos en portales de empleo colombianos.
 * 
 * Estrategia:
 * 1. Google Custom Search API (oficial y legal, 100 búsquedas gratis/día)
 * 2. Computrabajo con headers avanzados
 * 3. Búsqueda manual guiada con links directos
 * 
 * Solo se accede a información públicamente disponible.
 * Cumple con Ley 1581 de 2012 (Habeas Data - Colombia).
 */

const axios = require('axios');
const cheerio = require('cheerio');

const CITY = 'Cartagena';
const COUNTRY = 'Colombia';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-CO,es;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
    'Connection': 'keep-alive'
};

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ============================================================
// NORMALIZE
// ============================================================
function normalizeProfile(raw, source) {
    return {
        nombre: (raw.nombre || '').trim().substring(0, 100),
        email: raw.email ? raw.email.trim().toLowerCase() : null,
        telefono: raw.telefono ? raw.telefono.trim() : null,
        ciudad: (raw.ciudad || CITY).trim(),
        pais: COUNTRY,
        cargo_actual: raw.cargo_actual ? raw.cargo_actual.trim().substring(0, 150) : null,
        perfil_url: raw.perfil_url || null,
        resumen: raw.resumen ? raw.resumen.trim().substring(0, 400) : null,
        fuente: source,
        fecha_scraping: new Date().toISOString()
    };
}

// ============================================================
// 1. GOOGLE CUSTOM SEARCH API
// Requiere: GOOGLE_CSE_API_KEY y GOOGLE_CSE_ID en .env
// Gratis: 100 queries/día
// https://developers.google.com/custom-search/v1/overview
// ============================================================
async function searchGoogleCustom(keywords, ciudad, limit = 20) {
    const results = [];
    const apiKey = process.env.GOOGLE_CSE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;

    if (!apiKey || !cseId) {
        console.log('[Google CSE] No API key configured — skipping');
        return results;
    }

    try {
        // Search for public profiles on job portals
        const queries = [
            `"${keywords}" "${ciudad}" "Hoja de vida" OR "candidato" site:co.computrabajo.com`,
            `"${keywords}" "${ciudad}" Colombia site:linkedin.com/in`,
            `"${keywords}" "${ciudad}" Colombia "hoja de vida" OR "curriculum"`
        ];

        for (const q of queries.slice(0, 2)) {
            if (results.length >= limit) break;

            const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
                params: {
                    key: apiKey,
                    cx: cseId,
                    q: q,
                    gl: 'co',           // Country: Colombia
                    hl: 'es',           // Language: Spanish
                    num: 10,            // Max 10 per request
                    start: 1
                },
                timeout: 10000
            });

            if (response.data.items) {
                for (const item of response.data.items) {
                    if (results.length >= limit) break;

                    const title = item.title || '';
                    const snippet = item.snippet || '';
                    const link = item.link || '';

                    // Extract email from snippet
                    const emailMatch = snippet.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
                    const emailInMeta = (item.pagemap?.metatags?.[0]?.email);

                    // Extract person name
                    let nombre = '';
                    if (item.pagemap?.person?.[0]?.name) {
                        nombre = item.pagemap.person[0].name;
                    } else {
                        // Try to extract from title (e.g. "Juan Pérez - Ingeniero Civil - Computrabajo")
                        nombre = title.split(' - ')[0].split(' | ')[0].trim();
                    }

                    if (nombre.length >= 4 && nombre.split(' ').length >= 2) {
                        results.push(normalizeProfile({
                            nombre,
                            email: emailMatch?.[0] || emailInMeta || null,
                            cargo_actual: title.split(' - ')[1]?.split(' | ')[0]?.trim(),
                            ciudad: snippet.toLowerCase().includes(ciudad.toLowerCase()) ? ciudad : CITY,
                            perfil_url: link,
                            resumen: snippet
                        }, 'Google Search (Perfil Público)'));
                    }
                }
            }

            await delay(500); // Respect API rate limits
        }

    } catch (error) {
        if (error.response?.status === 429) {
            console.log('[Google CSE] Daily limit reached (100 queries/day). Try tomorrow.');
        } else if (error.response?.status === 403) {
            console.log('[Google CSE] Invalid API key or CSE ID. Check .env config.');
        } else {
            console.log(`[Google CSE] Error: ${error.message}`);
        }
    }

    return results;
}

// ============================================================
// 2. COMPUTRABAJO — Búsqueda avanzada con sesión simulada
// ============================================================
async function scrapeComputrabajo(keywords, ciudad, limit = 15) {
    const results = [];

    try {
        // First, get a session cookie
        await axios.get('https://co.computrabajo.com/', {
            headers: HEADERS,
            timeout: 10000,
            maxRedirects: 3
        });

        await delay(1500);

        // Now search
        const searchUrl = `https://co.computrabajo.com/candidatos?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(ciudad)}`;
        console.log(`[Computrabajo] GET ${searchUrl}`);

        const response = await axios.get(searchUrl, {
            headers: {
                ...HEADERS,
                'Referer': 'https://co.computrabajo.com/'
            },
            timeout: 20000,
            maxRedirects: 5
        });

        const $ = cheerio.load(response.data);
        console.log(`[Computrabajo] Status: ${response.status} | HTML size: ${response.data.length} bytes`);

        // Try multiple selectors for candidate listings
        const selectors = [
            '[data-qa="candidate-card-link"]',
            '.candidate-card',
            '.js-o-offer-link',
            '.offer_container article',
            'article.offer',
            '.box_offer',
            '[class*="candidato"]',
            '[class*="candidate"]'
        ];

        for (const selector of selectors) {
            const elements = $(selector);
            if (elements.length > 0) {
                console.log(`[Computrabajo] Found ${elements.length} elements with selector: ${selector}`);

                elements.each((i, el) => {
                    if (results.length >= limit) return false;
                    const $el = $(el);

                    const nombre = $el.find('h2, h3, [class*="title"], .name').first().text().trim() ||
                        $el.attr('title') || '';
                    const cargo = $el.find('[class*="subtitle"], [class*="profession"], .profession').first().text().trim();
                    const location = $el.find('[class*="location"], [class*="city"]').first().text().trim();
                    const link = $el.attr('href') || $el.find('a').first().attr('href');

                    if (nombre.length > 3) {
                        results.push(normalizeProfile({
                            nombre,
                            cargo_actual: cargo || null,
                            ciudad: location || ciudad,
                            perfil_url: link ? (link.startsWith('http') ? link : `https://co.computrabajo.com${link}`) : null
                        }, 'Computrabajo Colombia'));
                    }
                });
                break;
            }
        }

        if (results.length === 0) {
            // Log page structure for debugging
            const h1 = $('h1').first().text();
            const title = $('title').text();
            console.log(`[Computrabajo] Page title: "${title}" | H1: "${h1}"`);
            // Check if it's a CAPTCHA or login page
            if (title.toLowerCase().includes('captcha') || response.data.includes('robot')) {
                console.log('[Computrabajo] CAPTCHA detected — portal requires manual login');
            } else if (response.data.includes('iniciar sesion') || response.data.includes('login')) {
                console.log('[Computrabajo] Login required for this section');
            } else {
                console.log('[Computrabajo] No candidates found with current selectors — site may have changed structure');
            }
        }

    } catch (error) {
        if (error.response?.status === 403) {
            console.log('[Computrabajo] IP blocked (403) — their anti-bot system activated');
        } else {
            console.log(`[Computrabajo] Error: ${error.message}`);
        }
    }

    return results;
}

// ============================================================
// 3. ELEMPLEO.COM
// ============================================================
async function scrapeElempleo(keywords, ciudad, limit = 10) {
    const results = [];
    try {
        const url = `https://www.elempleo.com/co/hojas-de-vida?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(ciudad)}`;
        console.log(`[ElEmpleo] GET ${url}`);

        const response = await axios.get(url, {
            headers: HEADERS,
            timeout: 15000
        });

        const $ = cheerio.load(response.data);

        const selectors = ['.cv-card', '[class*="profile"]', '[class*="candidate"]', 'article'];
        for (const sel of selectors) {
            const els = $(sel);
            if (els.length > 0) {
                els.each((i, el) => {
                    if (results.length >= limit) return false;
                    const $el = $(el);
                    const nombre = $el.find('h2, h3, [class*="name"]').first().text().trim();
                    const cargo = $el.find('[class*="title"], [class*="job"]').first().text().trim();
                    const link = $el.find('a').first().attr('href');
                    if (nombre.length > 3) {
                        results.push(normalizeProfile({
                            nombre, cargo_actual: cargo, ciudad,
                            perfil_url: link ? (link.startsWith('http') ? link : `https://www.elempleo.com${link}`) : null
                        }, 'ElEmpleo.com'));
                    }
                });
                if (results.length > 0) break;
            }
        }
    } catch (error) {
        console.log(`[ElEmpleo] Error: ${error.message}`);
    }
    return results;
}

// ============================================================
// 4. GENERADOR DE LINKS DIRECTOS para búsqueda manual
// Cuando los scrapers no pueden acceder, retorna links directos
// para que el reclutador busque manualmente en el portal
// ============================================================
function generateDirectLinks(keywords, ciudad) {
    const kwEnc = encodeURIComponent(keywords);
    const cityEnc = encodeURIComponent(ciudad);
    const kwGoogle = encodeURIComponent(`"${keywords}" "${ciudad}" Colombia hoja de vida`);

    return [
        {
            nombre: `🔗 Buscar en Computrabajo`,
            fuente: 'Computrabajo Colombia',
            ciudad: ciudad,
            pais: COUNTRY,
            email: null,
            telefono: null,
            cargo_actual: `Candidatos para: ${keywords}`,
            perfil_url: `https://co.computrabajo.com/candidatos?q=${kwEnc}&l=${cityEnc}`,
            resumen: `Haz clic en "Ver Perfil" para buscar candidatos de ${keywords} en ${ciudad} directamente en Computrabajo. El portal requiere cuenta de empresa para ver datos de contacto completos.`,
            fecha_scraping: new Date().toISOString(),
            es_link_directo: true
        },
        {
            nombre: `🔗 Buscar en ElEmpleo.com`,
            fuente: 'ElEmpleo.com',
            ciudad: ciudad,
            pais: COUNTRY,
            email: null,
            telefono: null,
            cargo_actual: `Candidatos para: ${keywords}`,
            perfil_url: `https://www.elempleo.com/co/hojas-de-vida?q=${kwEnc}&l=${cityEnc}`,
            resumen: `Haz clic en "Ver Perfil" para buscar candidatos de ${keywords} en ${ciudad} directamente en ElEmpleo.`,
            fecha_scraping: new Date().toISOString(),
            es_link_directo: true
        },
        {
            nombre: `🔗 Buscar en Indeed Colombia`,
            fuente: 'Indeed.com',
            ciudad: ciudad,
            pais: COUNTRY,
            email: null,
            telefono: null,
            cargo_actual: `Candidatos para: ${keywords}`,
            perfil_url: `https://co.indeed.com/resumes?q=${kwEnc}&l=${cityEnc}`,
            resumen: `Busca CVs de ${keywords} en ${ciudad} en Indeed Colombia. (Requiere cuenta Indeed Employer)`,
            fecha_scraping: new Date().toISOString(),
            es_link_directo: true
        },
        {
            nombre: `🔗 Perfiles Públicos en Google`,
            fuente: 'Google Search (Perfil Público)',
            ciudad: ciudad,
            pais: COUNTRY,
            email: null,
            telefono: null,
            cargo_actual: `Candidatos para: ${keywords}`,
            perfil_url: `https://www.google.com/search?q=${kwGoogle}`,
            resumen: `Busca hojas de vida y perfiles públicos de "${keywords}" en "${ciudad}" vía Google. Encuentra CVs en formato PDF, perfiles de LinkedIn y Computrabajo.`,
            fecha_scraping: new Date().toISOString(),
            es_link_directo: true
        },
        {
            nombre: `🔗 LinkedIn Talent Search`,
            fuente: 'LinkedIn',
            ciudad: ciudad,
            pais: COUNTRY,
            email: null,
            telefono: null,
            cargo_actual: `Candidatos para: ${keywords}`,
            perfil_url: `https://www.linkedin.com/search/results/people/?keywords=${kwEnc}&geoUrn=%5B%22102723561%22%5D&origin=FACETED_SEARCH`,
            resumen: `Busca perfiles de LinkedIn en Colombia para el cargo "${keywords}". Abre con tu cuenta LinkedIn.`,
            fecha_scraping: new Date().toISOString(),
            es_link_directo: true
        },
        {
            nombre: `🔗 Magneto365 Colombia`,
            fuente: 'Magneto365',
            ciudad: ciudad,
            pais: COUNTRY,
            email: null,
            telefono: null,
            cargo_actual: `Candidatos para: ${keywords}`,
            perfil_url: `https://www.magneto365.com/co/empleos?q=${kwEnc}&ciudad=${cityEnc}`,
            resumen: `Portal de empleo colombiano. Busca candidatos de "${keywords}" en ${ciudad}.`,
            fecha_scraping: new Date().toISOString(),
            es_link_directo: true
        }
    ];
}

// ============================================================
// MAIN SEARCH FUNCTION
// ============================================================
async function searchCandidates({ keywords, ciudad = CITY, limit = 30, fuentes = ['computrabajo', 'google', 'elempleo'] }) {
    console.log(`\n🔍 Colombia Jobs Search`);
    console.log(`   Keywords: "${keywords}" | Ciudad: ${ciudad} | Fuentes: ${fuentes.join(', ')}`);

    const allResults = [];
    const errors = [];

    // Run real scrapers
    const scraperJobs = [];

    if (fuentes.includes('computrabajo')) {
        scraperJobs.push(
            scrapeComputrabajo(keywords, ciudad, Math.ceil(limit / 2))
                .then(r => { console.log(`[Result] Computrabajo: ${r.length} candidatos`); return r; })
                .catch(e => { errors.push(`Computrabajo: ${e.message}`); return []; })
        );
    }
    if (fuentes.includes('elempleo')) {
        scraperJobs.push(
            delay(800).then(() => scrapeElempleo(keywords, ciudad, Math.ceil(limit / 3)))
                .then(r => { console.log(`[Result] ElEmpleo: ${r.length} candidatos`); return r; })
                .catch(e => { errors.push(`ElEmpleo: ${e.message}`); return []; })
        );
    }
    if (fuentes.includes('google') || fuentes.includes('cse')) {
        scraperJobs.push(
            delay(1200).then(() => searchGoogleCustom(keywords, ciudad, Math.ceil(limit / 2)))
                .then(r => { console.log(`[Result] Google CSE: ${r.length} candidatos`); return r; })
                .catch(e => { errors.push(`Google CSE: ${e.message}`); return []; })
        );
    }

    const batches = await Promise.all(scraperJobs);
    batches.forEach(b => allResults.push(...b));

    // Remove duplicates
    const seen = new Set();
    const unique = allResults.filter(c => {
        const key = c.nombre.toLowerCase().replace(/\s+/g, '');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Generate direct links (always included as helpers)
    const directLinks = generateDirectLinks(keywords, ciudad);

    // Combine: real results first, then direct links
    const finalResults = [...unique, ...directLinks].slice(0, Math.max(limit, unique.length + directLinks.length));

    console.log(`📊 Total: ${unique.length} candidatos reales + ${directLinks.length} links directos`);

    return {
        candidatos: finalResults,
        candidatos_reales: unique.length,
        links_directos: directLinks.length,
        total_encontrados: unique.length,
        fuentes_exitosas: fuentes.length - errors.length,
        fuentes_fallidas: errors.length,
        errores: errors,
        ciudad,
        keywords,
        timestamp: new Date().toISOString(),
        nota: unique.length === 0
            ? 'Los portales de empleo requieren autenticación de empresa para acceder a datos de candidatos. Use los links directos para buscar manualmente.'
            : null
    };
}

module.exports = {
    searchCandidates,
    scrapeComputrabajo,
    scrapeElempleo,
    searchGoogleCustom,
    generateDirectLinks
};
